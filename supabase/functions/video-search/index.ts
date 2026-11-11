// @ts-expect-error Deno resolves npm: specifiers when deploying Edge Functions.
import { createClient } from 'npm:@supabase/supabase-js@2'; // eslint-disable-line import/no-unresolved

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

const MODEL = 'gemini-embedding-001';
const VECTOR_DIMENSIONS = 768;
const CONTENT_TASK_TYPE = 'RETRIEVAL_DOCUMENT';
const QUERY_TASK_TYPE = 'RETRIEVAL_QUERY';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-video-search-indexer-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type SearchAction = 'search' | 'index-video' | 'process-pending';

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function createEmbeddingClient() {
  return createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function createEmbedding(input: string, taskType: string): Promise<number[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:embedContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': requiredEnv('GEMINI_API_KEY'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: `models/${MODEL}`,
      content: { parts: [{ text: input }] },
      taskType,
      outputDimensionality: VECTOR_DIMENSIONS,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    console.error('Gemini embedding API returned an error:', response.status);
    throw new Error('Embedding provider request failed.');
  }

  const payload = await response.json();
  const embedding = payload?.embedding?.values;
  if (!Array.isArray(embedding) || embedding.length !== VECTOR_DIMENSIONS
    || !embedding.every((value: unknown) => typeof value === 'number' && Number.isFinite(value))) {
    throw new Error('Embedding provider returned an invalid vector.');
  }
  return embedding;
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';
}

async function indexVideo(
  admin: ReturnType<typeof createEmbeddingClient>,
  videoId: string,
  requestedAt?: string,
): Promise<void> {
  let jobRequestedAt = requestedAt;
  if (!jobRequestedAt) {
    const { data: job, error: jobError } = await admin
      .from('video_search_embedding_jobs')
      .select('requested_at')
      .eq('video_id', videoId)
      .maybeSingle();
    if (jobError) throw jobError;
    jobRequestedAt = job?.requested_at;
  }

  const { data: video, error: videoError } = await admin
    .from('videos')
    .select('id, title, description, topic_id, visibility')
    .eq('id', videoId)
    .maybeSingle();
  if (videoError) throw videoError;

  if (!video || video.visibility !== 'PUBLIC') {
    const { error } = await admin.from('video_search_embeddings').delete().eq('video_id', videoId);
    if (error) throw error;
  } else {
    let topicName = '';
    if (video.topic_id) {
      const { data: topic, error: topicError } = await admin
        .from('topics')
        .select('name')
        .eq('id', video.topic_id)
        .maybeSingle();
      if (topicError) throw topicError;
      topicName = cleanText(topic?.name, 300);
    }

    const content = [
      `Title: ${cleanText(video.title, 1000)}`,
      `Description: ${cleanText(video.description, 4000)}`,
      `Topic: ${topicName}`,
    ].filter((part) => !part.endsWith(': ')).join('\n').slice(0, 5500);
    if (!content) {
      const { error } = await admin.from('video_search_embeddings').delete().eq('video_id', videoId);
      if (error) throw error;
    } else {
      const contentHash = await sha256(`${MODEL}:${VECTOR_DIMENSIONS}:${CONTENT_TASK_TYPE}\n${content}`);
      const { data: existing, error: existingError } = await admin
        .from('video_search_embeddings')
        .select('content_hash, model')
        .eq('video_id', videoId)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing?.content_hash !== contentHash || existing?.model !== MODEL) {
        const embedding = await createEmbedding(content, CONTENT_TASK_TYPE);
        const { error } = await admin.from('video_search_embeddings').upsert({
          video_id: videoId,
          embedding: `[${embedding.join(',')}]`,
          model: MODEL,
          content_hash: contentHash,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      }
    }
  }

  if (jobRequestedAt) {
    const { error: jobError } = await admin
      .from('video_search_embedding_jobs')
      .delete()
      .eq('video_id', videoId)
      .eq('requested_at', jobRequestedAt);
    if (jobError) throw jobError;
  }
}

async function getUserId(request: Request): Promise<string | null> {
  const authorization = request.headers.get('authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!token || !publicKey) return null;

  const userClient = createClient(requiredEnv('SUPABASE_URL'), publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await userClient.auth.getUser(token);
  return error ? null : data.user?.id ?? null;
}

async function rateLimitActor(admin: ReturnType<typeof createEmbeddingClient>, request: Request): Promise<string> {
  const userId = await getUserId(request);
  let actorKey = userId;
  if (!actorKey) {
    const forwardedIp = request.headers.get('x-real-ip')
      ?? request.headers.get('cf-connecting-ip')
      ?? 'unknown';
    actorKey = `anon:${await sha256(forwardedIp)}`;
  }

  const { data, error } = await admin.rpc('consume_video_search_rate_limit', { p_actor_key: actorKey });
  if (error) throw error;
  if (data !== true) throw new Response('Rate limit exceeded.', { status: 429 });
  return userId ?? '';
}

async function processPending(admin: ReturnType<typeof createEmbeddingClient>) {
  const { data: jobs, error } = await admin
    .from('video_search_embedding_jobs')
    .select('video_id, requested_at, attempts')
    .order('requested_at', { ascending: true })
    .limit(25);
  if (error) throw error;

  let processed = 0;
  let failed = 0;
  for (const job of jobs || []) {
    try {
      await indexVideo(admin, job.video_id, job.requested_at);
      processed += 1;
    } catch (error) {
      console.error('Failed to process a video search indexing job:', error);
      const { error: updateError } = await admin
        .from('video_search_embedding_jobs')
        .update({ attempts: job.attempts + 1, last_error: 'Indexing failed; retry required.' })
        .eq('video_id', job.video_id)
        .eq('requested_at', job.requested_at);
      if (updateError) throw updateError;
      failed += 1;
    }
  }

  const { count, error: countError } = await admin
    .from('video_search_embedding_jobs')
    .select('video_id', { count: 'exact', head: true });
  if (countError) throw countError;
  return { processed, failed, remaining: count ?? 0 };
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  try {
    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      return jsonResponse(400, { error: 'Request body must be valid JSON.' });
    }
    const action = payload?.action as SearchAction | undefined;
    const admin = createEmbeddingClient();

    if (action === 'process-pending') {
      const secret = requiredEnv('VIDEO_SEARCH_INDEXER_SECRET').trim();
      const providedSecret = request.headers.get('x-video-search-indexer-secret')?.trim();
      if (!providedSecret || providedSecret !== secret) {
        console.warn('Rejected video indexing request: indexer secret did not match.');
        return jsonResponse(401, { error: 'Unauthorized.' });
      }
      return jsonResponse(200, await processPending(admin));
    }

    if (action === 'index-video') {
      const videoId = cleanText(payload?.videoId, 36);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(videoId)) {
        return jsonResponse(400, { error: 'A valid video ID is required.' });
      }
      const userId = await getUserId(request);
      if (!userId) return jsonResponse(401, { error: 'Sign in to index a video.' });

      const { data: owner, error: ownerError } = await admin
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();
      if (ownerError) throw ownerError;
      if (!owner) return jsonResponse(403, { error: 'Video owner could not be verified.' });

      const { data: video, error: videoError } = await admin
        .from('videos')
        .select('creator_id')
        .eq('id', videoId)
        .maybeSingle();
      if (videoError) throw videoError;
      if (!video || video.creator_id !== owner.id) return jsonResponse(403, { error: 'Video owner could not be verified.' });

      await indexVideo(admin, videoId);
      return jsonResponse(200, { indexed: true });
    }

    if (action !== 'search') return jsonResponse(400, { error: 'Unsupported action.' });
    if (typeof payload?.query !== 'string' || payload.query.trim().length > 300) {
      return jsonResponse(400, { error: 'The search query must be 300 characters or fewer.' });
    }
    const query = cleanText(payload.query, 300);
    if (!query) return jsonResponse(400, { error: 'A search query is required.' });

    await rateLimitActor(admin, request);
    const embedding = await createEmbedding(query, QUERY_TASK_TYPE);
    const { data: matches, error } = await admin.rpc('search_public_videos', {
      p_query_embedding: `[${embedding.join(',')}]`,
      p_query_text: query,
      p_limit: 30,
    });
    if (error) throw error;

    const videoIds = (matches || []).map((match: { video_id: string }) => match.video_id);
    return jsonResponse(200, { videoIds, mode: 'hybrid' });
  } catch (error) {
    if (error instanceof Response && error.status === 429) {
      return jsonResponse(429, { error: 'Search limit reached. Try again in a minute.' });
    }
    console.error('Video search request failed:', error);
    return jsonResponse(502, { error: 'Semantic search is temporarily unavailable.' });
  }
});
