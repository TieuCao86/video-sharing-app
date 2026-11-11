drop function if exists public.search_public_videos(extensions.vector, text, integer);
drop table if exists public.video_search_embeddings;

create table public.video_search_embeddings (
  video_id uuid primary key references public.videos(id) on delete cascade,
  embedding extensions.vector(768) not null,
  model text not null,
  content_hash text not null,
  updated_at timestamptz not null default now()
);

create index video_search_embeddings_hnsw_idx
  on public.video_search_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.video_search_embeddings enable row level security;
revoke all on public.video_search_embeddings from public, anon, authenticated;
grant all on public.video_search_embeddings to service_role;

insert into public.video_search_embedding_jobs (video_id, requested_at, attempts, last_error)
select v.id, now(), 0, null
from public.videos v
where v.visibility = 'PUBLIC'
on conflict (video_id) do update
  set requested_at = excluded.requested_at,
      attempts = 0,
      last_error = null;

create or replace function public.search_public_videos(
  p_query_embedding extensions.vector(768),
  p_query_text text,
  p_limit integer default 30
)
returns table (video_id uuid, score real)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with query_terms as (
    select plainto_tsquery('simple', left(coalesce(p_query_text, ''), 300)) as value
  ),
  vector_hits as (
    select e.video_id,
           (1 - (e.embedding <=> p_query_embedding))::real as semantic_score
    from public.video_search_embeddings e
    join public.videos v on v.id = e.video_id
    where v.visibility = 'PUBLIC'
    order by e.embedding <=> p_query_embedding
    limit least(greatest(coalesce(p_limit, 30), 1), 50)
  ),
  keyword_hits as (
    select v.id as video_id,
           ts_rank_cd(
             to_tsvector('simple', concat_ws(' ', v.title, v.description, t.name)),
             q.value
           )::real as keyword_score
    from public.videos v
    left join public.topics t on t.id = v.topic_id
    cross join query_terms q
    where v.visibility = 'PUBLIC'
      and numnode(q.value) > 0
      and to_tsvector('simple', concat_ws(' ', v.title, v.description, t.name)) @@ q.value
    order by keyword_score desc
    limit least(greatest(coalesce(p_limit, 30), 1), 50)
  ),
  candidates as (
    select vh.video_id, vh.semantic_score, 0::real as keyword_score from vector_hits vh
    union all
    select kh.video_id, 0::real, kh.keyword_score from keyword_hits kh
  )
  select c.video_id,
         (greatest(max(c.semantic_score), 0) * 0.75
          + case when max(c.keyword_score) > 0
              then 0.4 + least(max(c.keyword_score), 1) * 0.35
              else 0
            end)::real as score
  from candidates c
  group by c.video_id
  order by score desc, c.video_id
  limit least(greatest(coalesce(p_limit, 30), 1), 50);
$$;

revoke all on function public.search_public_videos(extensions.vector, text, integer) from public, anon, authenticated;
grant execute on function public.search_public_videos(extensions.vector, text, integer) to service_role;
