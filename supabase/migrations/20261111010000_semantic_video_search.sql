create schema if not exists extensions;
create extension if not exists vector with schema extensions;

create table if not exists public.video_search_embeddings (
  video_id uuid primary key references public.videos(id) on delete cascade,
  embedding extensions.vector(1536) not null,
  model text not null,
  content_hash text not null,
  updated_at timestamptz not null default now()
);

create index if not exists video_search_embeddings_hnsw_idx
  on public.video_search_embeddings
  using hnsw (embedding extensions.vector_cosine_ops);

create table if not exists public.video_search_embedding_jobs (
  video_id uuid primary key references public.videos(id) on delete cascade,
  requested_at timestamptz not null default now(),
  attempts integer not null default 0,
  last_error text
);

create index if not exists video_search_embedding_jobs_requested_at_idx
  on public.video_search_embedding_jobs (requested_at);

create table if not exists public.video_search_rate_limits (
  actor_key text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1 check (request_count > 0)
);

alter table public.video_search_embeddings enable row level security;
alter table public.video_search_embedding_jobs enable row level security;
alter table public.video_search_rate_limits enable row level security;

revoke all on public.video_search_embeddings from public, anon, authenticated;
revoke all on public.video_search_embedding_jobs from public, anon, authenticated;
revoke all on public.video_search_rate_limits from public, anon, authenticated;
grant all on public.video_search_embeddings to service_role;
grant all on public.video_search_embedding_jobs to service_role;
grant all on public.video_search_rate_limits to service_role;

create or replace function public.enqueue_video_search_embedding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.video_search_embeddings where video_id = old.id;
    delete from public.video_search_embedding_jobs where video_id = old.id;
    return old;
  end if;

  if new.visibility = 'PUBLIC' then
    delete from public.video_search_embeddings where video_id = new.id;
    insert into public.video_search_embedding_jobs (video_id, requested_at, attempts, last_error)
    values (new.id, now(), 0, null)
    on conflict (video_id) do update
      set requested_at = excluded.requested_at,
          attempts = 0,
          last_error = null;
  else
    delete from public.video_search_embeddings where video_id = new.id;
    delete from public.video_search_embedding_jobs where video_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists videos_enqueue_search_embedding on public.videos;
create trigger videos_enqueue_search_embedding
after insert or update of title, description, topic_id, visibility or delete
on public.videos
for each row execute function public.enqueue_video_search_embedding();

create or replace function public.enqueue_topic_video_embeddings()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.name is distinct from old.name then
    insert into public.video_search_embedding_jobs (video_id, requested_at, attempts, last_error)
    select v.id, now(), 0, null
    from public.videos v
    where v.topic_id = new.id and v.visibility = 'PUBLIC'
    on conflict (video_id) do update
      set requested_at = excluded.requested_at,
          attempts = 0,
          last_error = null;

    delete from public.video_search_embeddings e
    using public.videos v
    where e.video_id = v.id
      and v.topic_id = new.id
      and v.visibility = 'PUBLIC';
  end if;
  return new;
end;
$$;

drop trigger if exists topics_enqueue_video_search_embeddings on public.topics;
create trigger topics_enqueue_video_search_embeddings
after update of name on public.topics
for each row execute function public.enqueue_topic_video_embeddings();

insert into public.video_search_embedding_jobs (video_id)
select v.id
from public.videos v
where v.visibility = 'PUBLIC'
on conflict (video_id) do nothing;

create or replace function public.search_public_videos(
  p_query_embedding extensions.vector(1536),
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

create or replace function public.consume_video_search_rate_limit(p_actor_key text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.video_search_rate_limits as limits (actor_key, window_started_at, request_count)
  values (left(p_actor_key, 80), now(), 1)
  on conflict (actor_key) do update
    set window_started_at = case
          when limits.window_started_at <= now() - interval '1 minute' then now()
          else limits.window_started_at
        end,
        request_count = case
          when limits.window_started_at <= now() - interval '1 minute' then 1
          else limits.request_count + 1
        end
  returning request_count into current_count;

  return current_count <= 30;
end;
$$;

revoke all on function public.consume_video_search_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_video_search_rate_limit(text) to service_role;
