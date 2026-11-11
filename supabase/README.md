# Semantic video search

The search function uses Google's Gemini `gemini-embedding-001` model with 768-dimensional vectors from a Supabase Edge Function. Google AI and Supabase service-role keys must remain server-side; never add them to Expo `EXPO_PUBLIC_*` variables.

## Deploy

You can configure the hosted project entirely in the Supabase Dashboard:

1. In **Database > Extensions**, enable `vector` (pgvector).
2. Open **SQL Editor** and apply the SQL migrations in timestamp order. If setting this up for the first time, run `migrations/20261111010000_semantic_video_search.sql` followed by `migrations/20261111020000_gemini_video_search_embeddings.sql`. If the first migration was already applied, run only the Gemini migration. The Gemini migration replaces old vectors and queues public videos for re-embedding.
3. In Google AI Studio, create a Gemini API key. Then open **Edge Functions > Secrets** and add `GEMINI_API_KEY` and `VIDEO_SEARCH_INDEXER_SECRET`. Generate a unique random value for the latter and keep it private. Do not put either secret in the app or a `EXPO_PUBLIC_*` variable. `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are provided by the Edge Function runtime.
4. Open **Edge Functions**, select **Deploy a new function > Via Editor**, create `video-search`, and replace its code with `functions/video-search/index.ts`; then click **Deploy function**. If the Dashboard editor cannot resolve the `npm:` import, deploy the same source with the Supabase CLI instead.
5. After deployment, backfill existing public videos. In the function's **Test** panel, send a POST request with body `{ "action": "process-pending" }`, header `x-video-search-indexer-secret: <your-secret>`, and the project's normal `apikey` and `Authorization` headers. Repeat until the response reports `remaining: 0`. The migration queues existing public videos; newly published videos request indexing after creation.

For CLI-based deployment instead, link the project, run `supabase db push`, set `GEMINI_API_KEY` and `VIDEO_SEARCH_INDEXER_SECRET` with `supabase secrets set`, and run `supabase functions deploy video-search`.

Database triggers queue re-indexing when a video's title, description, topic, visibility, or a topic name changes. If a provider request fails, its job remains queued for a later `process-pending` run. Search continues to use keyword results when the semantic endpoint is unavailable and shows a notice in the app.

The RPC exposes only `PUBLIC` video IDs. Embeddings, indexing jobs, and rate-limit records have RLS enabled and are unavailable to client roles; only the Edge Function's service role can access them. Search is limited to 30 requests per minute per authenticated user or hashed client IP.
