import { db } from './mocks/fakeSupabase';

let n = 0;
const hex = (k: number, len: number) => k.toString(16).padStart(len, '0');
/** UUID cố định, dễ đọc khi debug. */
export const uid = (k: number) => `${hex(k, 8)}-0000-4000-8000-${hex(k, 12)}`;

export function seedUser(name: string, extra: Record<string, any> = {}) {
  const id = uid(++n + 100);
  (db.users ??= []).push({ id, display_name: name, avatar_url: null, bio: '', email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`, created_at: '2026-01-01T00:00:00Z', ...extra });
  return id;
}

export function seedVideo(creatorId: string, extra: Record<string, any> = {}) {
  const id = uid(++n + 5000);
  (db.videos ??= []).push({
    id, creator_id: creatorId, title: 'Video ' + id.slice(-3), description: '', visibility: 'PUBLIC',
    views_count: 0, likes_count: 0, comments_count: 0, video_url: 'https://cdn.test/' + id + '.mp4', cover_url: '',
    created_at: new Date(Date.parse('2026-10-01T00:00:00Z') + n * 60000).toISOString(), ...extra,
  });
  return id;
}

/** Đợi các tác vụ "fire-and-forget" (void (async () => …)()) chạy xong. */
export const flush = () => new Promise((r) => setTimeout(r, 20));
