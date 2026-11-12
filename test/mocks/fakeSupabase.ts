/**
 * Supabase giả lập (in-memory) thay cho utils/supabase.ts khi chạy Jest.
 * Mô phỏng: PostgREST query builder (select/eq/neq/in/ilike/order/limit/single/maybeSingle,
 * insert/upsert/update/delete), ràng buộc UNIQUE (lỗi 23505), Auth (signUp/OTP/signIn/session),
 * Storage (upload/getPublicUrl/remove) và Edge Function (functions.invoke).
 */
type Row = Record<string, any>;

const UNIQUE: Record<string, string[]> = {
  follows: ['follower_id', 'following_id'],
  likes: ['user_id', 'video_id'],
  comment_likes: ['user_id', 'comment_id'],
  saved_audio_tracks: ['user_id', 'audio_track_id'],
};

let seq = 0;
let clock = Date.parse('2026-11-01T00:00:00Z');
const nextId = (p: string) => `${p}-${++seq}`;
const now = () => new Date((clock += 1000)).toISOString();

export const db: Record<string, Row[]> = {};
export const calls: { table: string; op: string; filters: any[] }[] = [];
/** Lỗi được "bơm" cho thao tác kế tiếp trên bảng: key = 'table:op' */
const injected = new Map<string, any>();
export function failNext(table: string, op: 'select' | 'insert' | 'update' | 'delete', error: any) {
  injected.set(`${table}:${op}`, error);
}

export interface AuthUser { id: string; email: string; password: string; confirmed: boolean; otp: string; user_metadata: any; }
export const auth = { users: [] as AuthUser[], session: null as null | { user: AuthUser }, otpCode: '123456' };
export const storage = { files: new Map<string, number>(), uploadError: null as any, removed: [] as string[] };
export const functionsCfg = { response: null as any, error: { message: 'edge function unavailable', context: undefined as any } as any };

export function resetDb() {
  for (const k of Object.keys(db)) delete db[k];
  calls.length = 0; injected.clear();
  auth.users = []; auth.session = null;
  storage.files.clear(); storage.uploadError = null; storage.removed = [];
  functionsCfg.response = null; functionsCfg.error = { message: 'edge function unavailable', context: undefined };
}
const table = (t: string) => (db[t] ??= []);

function uuid() {
  const h = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${h(8)}-${h(4)}-4${h(3)}-8${h(3)}-${h(12)}`;
}

function attachJoins(sel: string, row: Row): Row {
  const out = { ...row };
  if (/profiles:creator_id/.test(sel) && 'creator_id' in row) {
    out.profiles = table('users').find((u) => u.id === row.creator_id) ?? null;
  }
  if (/audio_tracks:audio_track_id/.test(sel)) {
    out.audio_tracks = table('audio_tracks').find((a) => a.id === row.audio_track_id) ?? null;
  }
  if (/videos:video_id/.test(sel)) {
    const v = table('videos').find((x) => x.id === row.video_id);
    out.videos = v ? attachJoins('profiles:creator_id', v) : null;
  }
  if (/video:video_id/.test(sel)) {
    out.video = table('videos').find((x) => x.id === row.video_id) ?? null;
  }
  return out;
}

class Query implements PromiseLike<any> {
  private filters: ((r: Row) => boolean)[] = [];
  private desc: any[] = [];
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private sel = '*';
  private countMode = false;
  private head = false;
  private payload: any;
  private orderBy?: { col: string; asc: boolean };
  private lim?: number;
  private off = 0;
  private mode: 'many' | 'single' | 'maybe' = 'many';
  private returning = false;
  constructor(private t: string) {}

  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    if (this.op === 'select') this.sel = cols; else this.returning = true;
    if (opts?.count) this.countMode = true;
    if (opts?.head) this.head = true;
    return this;
  }
  insert(p: any) { this.op = 'insert'; this.payload = p; return this; }
  upsert(p: any) { this.op = 'upsert'; this.payload = p; return this; }
  update(p: any) { this.op = 'update'; this.payload = p; return this; }
  delete() { this.op = 'delete'; return this; }
  eq(c: string, v: any) { this.desc.push(['eq', c, v]); this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.desc.push(['neq', c, v]); this.filters.push((r) => r[c] !== v); return this; }
  gte(c: string, v: any) { this.desc.push(['gte', c, v]); this.filters.push((r) => r[c] >= v); return this; }
  in(c: string, vs: any[]) { this.desc.push(['in', c, vs]); this.filters.push((r) => vs.includes(r[c])); return this; }
  ilike(c: string, pattern: string) {
    this.desc.push(['ilike', c, pattern]);
    const body = pattern.replace(/^%|%$/g, '').replace(/\\([\\%_])/g, '$1').toLowerCase();
    this.filters.push((r) => String(r[c] ?? '').toLowerCase().includes(body));
    return this;
  }
  order(col: string, o?: { ascending?: boolean }) { this.orderBy = { col, asc: o?.ascending ?? true }; return this; }
  limit(n: number) { this.lim = n; return this; }
  range(from: number, to: number) { this.off = from; this.lim = to - from + 1; return this; }
  single() { this.mode = 'single'; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }

  private run(): any {
    const opKey = this.op === 'upsert' ? 'insert' : this.op;
    calls.push({ table: this.t, op: this.op, filters: this.desc });
    const inj = injected.get(`${this.t}:${opKey}`);
    if (inj) { injected.delete(`${this.t}:${opKey}`); return { data: null, error: inj, count: null }; }
    const rows = table(this.t);
    const match = () => rows.filter((r) => this.filters.every((f) => f(r)));

    if (this.op === 'insert' || this.op === 'upsert') {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p: Row) => ({ ...p }));
      const out: Row[] = [];
      for (const it of items) {
        if (this.op === 'upsert' && it.id) {
          const ex = rows.find((r) => r.id === it.id);
          if (ex) { Object.assign(ex, it); out.push(ex); continue; }
        }
        const uk = UNIQUE[this.t];
        if (uk && rows.some((r) => uk.every((k) => r[k] === it[k]))) {
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
        }
        const row = { id: it.id ?? (this.t === 'videos' || this.t === 'users' ? uuid() : nextId(this.t)), created_at: now(), ...it };
        // Giá trị DEFAULT như schema Postgres
        if (this.t === 'comments') row.likes_count ??= 0;
        if (this.t === 'videos') { row.views_count ??= 0; row.likes_count ??= 0; row.comments_count ??= 0; }
        if (this.t === 'notifications') row.is_read ??= false;
        rows.push(row); out.push(row);
      }
      return this.shape(out);
    }
    if (this.op === 'update') {
      const m = match(); m.forEach((r) => Object.assign(r, this.payload));
      return this.returning ? { data: m, error: null, status: 200 } : { data: null, error: null, status: 204 };
    }
    if (this.op === 'delete') {
      const m = new Set(match());
      db[this.t] = rows.filter((r) => !m.has(r));
      return { data: null, error: null };
    }
    let res = match().map((r) => attachJoins(this.sel, r));
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      res.sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
    }
    if (this.lim !== undefined || this.off) res = res.slice(this.off, this.lim !== undefined ? this.off + this.lim : undefined);
    if (this.countMode) return { data: this.head ? null : res, count: res.length, error: null };
    return this.shape(res);
  }
  private shape(res: Row[]) {
    if (this.mode === 'single') {
      return res.length === 1 ? { data: res[0], error: null } : { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
    }
    if (this.mode === 'maybe') return { data: res[0] ?? null, error: null };
    return { data: res, error: null };
  }
  then<A, B>(ok?: (v: any) => A | PromiseLike<A>, ko?: (e: any) => B | PromiseLike<B>) {
    return Promise.resolve().then(() => this.run()).then(ok, ko);
  }
}

const authApi = {
  async signUp({ email, password, options }: any) {
    if (auth.users.some((u) => u.email === email)) return { data: { user: null }, error: { message: 'User already registered' } };
    const u: AuthUser = { id: uuid(), email, password, confirmed: false, otp: auth.otpCode, user_metadata: options?.data ?? {} };
    auth.users.push(u);
    return { data: { user: { id: u.id, user_metadata: u.user_metadata } }, error: null };
  },
  async verifyOtp({ email, token, type }: any) {
    const u = auth.users.find((x) => x.email === email);
    if (!u || u.otp !== token || type !== 'signup') return { data: { user: null }, error: { message: 'Token has expired or is invalid' } };
    u.confirmed = true;
    auth.session = { user: u };
    return { data: { user: { id: u.id, user_metadata: u.user_metadata } }, error: null };
  },
  async resend({ email }: any) {
    const u = auth.users.find((x) => x.email === email);
    if (!u) return { error: { message: 'User not found' } };
    return { error: null };
  },
  async signInWithPassword({ email, password }: any) {
    const u = auth.users.find((x) => x.email === email);
    if (!u || u.password !== password) return { data: { user: null }, error: { message: 'Invalid login credentials' } };
    if (!u.confirmed) return { data: { user: null }, error: { message: 'Email not confirmed' } };
    auth.session = { user: u };
    return { data: { user: { id: u.id, user_metadata: u.user_metadata } }, error: null };
  },
  async signOut() { auth.session = null; return { error: null }; },
  async getSession() {
    const s = auth.session;
    return { data: { session: s ? { user: { id: s.user.id, email: s.user.email, user_metadata: s.user.user_metadata } } : null } };
  },
  async getUser() {
    const s = auth.session;
    return { data: { user: s ? { id: s.user.id, email: s.user.email } : null }, error: null };
  },
  async updateUser({ password }: any) {
    if (!auth.session) return { error: { message: 'Auth session missing!' } };
    auth.session.user.password = password; return { data: {}, error: null };
  },
};

export const supabase: any = {
  from: (t: string) => new Query(t),
  auth: authApi,
  storage: {
    from: (bucket: string) => ({
      async upload(path: string, body: any) {
        if (storage.uploadError) return { error: storage.uploadError };
        storage.files.set(`${bucket}/${path}`, body?.byteLength ?? 0); return { error: null };
      },
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://storage.test/${bucket}/${path}` } }),
      async remove(paths: string[]) { paths.forEach((p) => { storage.removed.push(`${bucket}/${p}`); storage.files.delete(`${bucket}/${p}`); }); return { error: null }; },
    }),
  },
  functions: {
    async invoke(_name: string, { body }: any) {
      if (body?.action === 'index-video') return { data: { ok: true }, error: null };
      if (functionsCfg.error) return { data: null, error: functionsCfg.error };
      return { data: functionsCfg.response, error: null };
    },
  },
};
export default supabase;
