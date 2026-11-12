/**
 * UNIT TEST – chạy trực tiếp trên mã TypeScript thật của app (src/services, src/store).
 * Supabase được thay bằng stub in-memory (test/mocks/fakeSupabase.ts); mỗi test kiểm tra MỘT hàm.
 * Kết quả mong đợi theo SRS; test FAIL = code chưa đúng đặc tả.
 */
import { resetDb, db, supabase, calls, failNext, functionsCfg, storage, auth } from '../mocks/fakeSupabase';
import { seedUser, seedVideo, flush, uid } from '../helpers';
import { signUpWithEmail, loginWithEmail, verifyOtpCode, resendOtpCode } from '../../src/services/authService';
import { addComment, toggleLikeComment } from '../../src/services/commentService';
import { resolveDbUserId, toggleFollowUser, getFollowCounts } from '../../src/services/userService';
import { searchVideosWithStatus, toggleLikeVideo, getUserVideos, createVideoPost, getTrendingVideos } from '../../src/services/videoService';
import { authStore } from '../../src/store/useAuthStore';
import { draftsStore } from '../../src/store/useDraftsStore';

beforeEach(() => {
  resetDb();
  jest.restoreAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});

const authCalls = () => calls.length + auth.users.length;

describe('authService.signUpWithEmail', () => {
  test('TC01 – Tên hiển thị 1 ký tự bị từ chối, không gọi Supabase', async () => {
    const r = await signUpWithEmail('A', 'trung.test01@example.com', 'Trung1234');
    expect(r).toEqual({ success: false, message: 'Tên hiển thị phải từ 2 đến 50 ký tự.' });
    expect(authCalls()).toBe(0);
  });
  test('TC02 – Tên hiển thị 51 ký tự bị từ chối', async () => {
    const r = await signUpWithEmail('a'.repeat(51), 'trung.test01@example.com', 'Trung1234');
    expect(r.success).toBe(false);
  });
  test('TC03 – Email rỗng bị từ chối', async () => {
    const r = await signUpWithEmail('Trung Test', '   ', 'Trung1234');
    expect(r).toEqual({ success: false, message: 'Vui lòng nhập Email hợp lệ.' });
  });
  test('TC04 – Email sai định dạng "trung.test@" phải bị từ chối (SRS FR01)', async () => {
    const r = await signUpWithEmail('Trung Test', 'trung.test@', 'Trung1234');
    expect(r.success).toBe(false);
  });
  test('TC05 – Mật khẩu 7 ký tự phải bị từ chối (SRS: tối thiểu 8)', async () => {
    const r = await signUpWithEmail('Trung Test', 'trung.test05@example.com', 'Trung12');
    expect(r.success).toBe(false);
  });
  test('TC06 – Mật khẩu chỉ có chữ cái phải bị từ chối (SRS: có chữ và số)', async () => {
    const r = await signUpWithEmail('Trung Test', 'trung.test06@example.com', 'abcdefgh');
    expect(r.success).toBe(false);
  });
  test('TC07 – Đăng ký hợp lệ: tạo tài khoản, lưu users với avatar mặc định, báo gửi OTP', async () => {
    const r = await signUpWithEmail('  Trung Test ', 'trung.test01@example.com', 'Trung1234');
    expect(r).toEqual({ success: true, message: 'Mã xác nhận OTP đã được gửi về email của bạn.' });
    expect(db.users).toHaveLength(1);
    expect(db.users[0]).toMatchObject({ display_name: 'Trung Test', email: 'trung.test01@example.com', followers_count: 0 });
    expect(db.users[0].avatar_url).toMatch(/avt%20df\.png$/);
  });
  test('TC08 – Email đã tồn tại: trả lỗi từ Supabase, không tạo bản ghi thứ hai', async () => {
    await signUpWithEmail('Trung Test', 'existing@example.com', 'Trung1234');
    const r = await signUpWithEmail('Trung Two', 'existing@example.com', 'Trung1234');
    expect(r).toEqual({ success: false, message: 'User already registered' });
    expect(db.users).toHaveLength(1);
  });
});

describe('authService.loginWithEmail', () => {
  test('TC09 – Để trống email hoặc mật khẩu', async () => {
    expect(await loginWithEmail('', 'x')).toEqual({ success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu.' });
    expect(await loginWithEmail('a@b.c', '')).toMatchObject({ success: false });
  });
  test('TC10 – Sai mật khẩu: trả thông báo lỗi, không đăng nhập', async () => {
    auth.users.push({ id: uid(1), email: 'a@b.c', password: 'Right123', confirmed: true, otp: '1', user_metadata: {} });
    const r = await loginWithEmail('a@b.c', 'Wrong123');
    expect(r).toEqual({ success: false, message: 'Invalid login credentials' });
  });
  test('TC11 – Đăng nhập đúng: map hồ sơ từ bảng users và cập nhật authStore', async () => {
    const id = uid(2);
    auth.users.push({ id, email: 'a@b.c', password: 'Right123', confirmed: true, otp: '1', user_metadata: { name: 'Meta' } });
    db.users = [{ id, display_name: 'Trung DB', avatar_url: 'https://img/a.png', bio: 'hi', following_count: 3, followers_count: 4, likes_count: 5 }];
    const r = await loginWithEmail(' a@b.c ', 'Right123');
    expect(r.success).toBe(true);
    expect(r.user).toMatchObject({ id, name: 'Trung DB', avatar: 'https://img/a.png', following: 3, followers: 4, likes: 5, auth_id: id });
    expect(authStore.getState().isLoggedIn).toBe(true);
  });
});

describe('authService OTP', () => {
  test('TC12 – Xác thực OTP khi mã rỗng', async () => {
    expect(await verifyOtpCode('a@b.c', '  ')).toEqual({ success: false, message: 'Vui lòng nhập đầy đủ mã OTP.' });
  });
  test('TC13 – OTP type "signup" lỗi nhưng type "email" đúng → vẫn xác thực thành công', async () => {
    const spy = jest.spyOn(supabase.auth, 'verifyOtp')
      .mockResolvedValueOnce({ data: { user: null }, error: { message: 'bad type' } })
      .mockResolvedValueOnce({ data: { user: { id: uid(3), user_metadata: { name: 'T' } } }, error: null });
    const r = await verifyOtpCode('a@b.c', '123456', 'Trung');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(r).toEqual({ success: true, message: 'Xác thực tài khoản thành công! Vui lòng đăng nhập.' });
    expect(authStore.getState().isLoggedIn).toBe(false);
  });
  test('TC14 – OTP sai: trả thông báo mã không hợp lệ/hết hạn', async () => {
    await signUpWithEmail('Trung Test', 'otp@example.com', 'Trung1234');
    const r = await verifyOtpCode('otp@example.com', '000000');
    expect(r).toEqual({ success: false, message: 'Token has expired or is invalid' });
  });
  test('TC15 – Gửi lại OTP: email rỗng bị chặn; email hợp lệ gửi thành công', async () => {
    expect(await resendOtpCode(' ')).toMatchObject({ success: false });
    await signUpWithEmail('Trung Test', 'otp@example.com', 'Trung1234');
    expect(await resendOtpCode('otp@example.com')).toEqual({ success: true, message: 'Đã gửi lại mã OTP về email của bạn.' });
  });
});

describe('commentService', () => {
  test('TC16 – Bình luận rỗng sau trim bị từ chối', async () => {
    await expect(addComment('v1', uid(4), '    ')).rejects.toThrow('Nội dung bình luận phải từ 1 đến 500 ký tự');
  });
  test('TC17 – Bình luận 501 ký tự bị từ chối', async () => {
    await expect(addComment('v1', uid(4), 'x'.repeat(501))).rejects.toThrow('1 đến 500');
  });
  test('TC18 – Bình luận đúng 500 ký tự (có khoảng trắng 2 đầu) được lưu đã trim', async () => {
    const u = seedUser('Commenter');
    const c = await addComment('v1', u, '  ' + 'y'.repeat(500) + '  ');
    expect(c.content).toHaveLength(500);
    expect(db.comments[0]).toMatchObject({ video_id: 'v1', user_id: u, parent_id: null });
  });
  test('TC19 – Lỗi quyền (42501) khi gửi bình luận → thông báo "Hãy đăng nhập lại"', async () => {
    failNext('comments', 'insert', { code: '42501', message: 'RLS' });
    await expect(addComment('v1', uid(5), 'Hay quá')).rejects.toThrow('Không thể gửi bình luận. Hãy đăng nhập lại.');
  });
  test('TC20 – Thích rồi bỏ thích bình luận: likes_count 0 → 1 → 0', async () => {
    const owner = seedUser('Owner');
    const liker = seedUser('Liker');
    db.comments = [{ id: 'c1', user_id: owner, video_id: 'v1', content: 'hi', likes_count: 0 }];
    expect(await toggleLikeComment(liker, 'c1')).toEqual({ liked: true, likesCount: 1 });
    expect(await toggleLikeComment(liker, 'c1')).toEqual({ liked: false, likesCount: 0 });
  });
});

describe('userService', () => {
  test('TC21 – resolveDbUserId: id không phải UUID → undefined, không truy vấn DB', async () => {
    expect(await resolveDbUserId('mock-user-1')).toBeUndefined();
    expect(calls).toHaveLength(0);
  });
  test('TC22 – Không cho tự theo dõi chính mình', async () => {
    const me = seedUser('Me');
    await expect(toggleFollowUser(me, me)).rejects.toThrow('Không thể tự theo dõi chính mình.');
    expect(db.follows ?? []).toHaveLength(0);
  });
  test('TC23 – Follow rồi Unfollow: trả true rồi false', async () => {
    const a = seedUser('A'); const b = seedUser('B');
    expect(await toggleFollowUser(a, b)).toBe(true);
    expect(await toggleFollowUser(a, b)).toBe(false);
    expect(db.follows).toHaveLength(0);
  });
  test('TC24 – Insert follow bị trùng khóa (23505, bấm đúp) → vẫn trả true, không ném lỗi', async () => {
    const a = seedUser('A'); const b = seedUser('B');
    failNext('follows', 'insert', { code: '23505', message: 'duplicate' });
    await expect(toggleFollowUser(a, b)).resolves.toBe(true);
  });
  test('TC25 – getFollowCounts với id không hợp lệ → null', async () => {
    expect(await getFollowCounts('')).toBeNull();
    expect(await getFollowCounts('abc')).toBeNull();
  });
});

describe('videoService', () => {
  test('TC26 – Tìm kiếm với từ khóa chỉ có khoảng trắng → danh sách rỗng, không gọi API', async () => {
    expect(await searchVideosWithStatus('    ')).toEqual({ videos: [], mode: 'hybrid' });
    expect(calls).toHaveLength(0);
  });
  test('TC27 – Từ khóa 101 ký tự phải bị từ chối (SRS: tối đa 100)', async () => {
    await expect(searchVideosWithStatus('k'.repeat(101))).rejects.toThrow();
  });
  test('TC28 – Từ khóa 301 ký tự → lỗi "Search query is too long."', async () => {
    await expect(searchVideosWithStatus('k'.repeat(301))).rejects.toThrow('Search query is too long.');
  });
  test('TC29 – Edge function lỗi → chuyển sang tìm theo từ khóa, có cảnh báo, escape ký tự %', async () => {
    const u = seedUser('Creator');
    seedVideo(u, { title: 'Sale 50% off', views_count: 9 });
    seedVideo(u, { title: 'Sale 500 off', views_count: 99 });
    const r = await searchVideosWithStatus('50%');
    expect(r.mode).toBe('keyword');
    expect(r.warning).toMatch(/Tìm kiếm ngữ nghĩa/);
    expect(r.videos.map((v) => v.title)).toEqual(['Sale 50% off']);
    expect(calls.find((c) => c.table === 'videos')!.filters).toContainEqual(['ilike', 'title', '%50\\%%']);
  });
  test('TC30 – Edge function trả 429 → báo vượt giới hạn, KHÔNG fallback', async () => {
    functionsCfg.error = { message: 'rate', context: new Response(null, { status: 429 }) };
    await expect(searchVideosWithStatus('cat')).rejects.toThrow('Search limit reached. Please try again in a minute.');
  });
  test('TC31 – Like video người khác → tạo thông báo; like video của mình → không tạo', async () => {
    const me = seedUser('Me'); const other = seedUser('Other');
    const v1 = seedVideo(other); const v2 = seedVideo(me);
    expect(await toggleLikeVideo(me, v1)).toBe(true);
    expect(await toggleLikeVideo(me, v2)).toBe(true);
    await flush();
    expect(db.notifications).toHaveLength(1);
    expect(db.notifications[0]).toMatchObject({ type: 'like', sender_id: me, recipient_id: other, video_id: v1 });
  });
  test('TC32 – getUserVideos: id không phải UUID → []; truy vấn loại DELETED và DRAFT', async () => {
    expect(await getUserVideos('abc')).toEqual([]);
    const u = seedUser('U');
    await getUserVideos(u);
    const q = calls.find((c) => c.table === 'videos')!;
    expect(q.filters).toEqual(expect.arrayContaining([['neq', 'visibility', 'DELETED'], ['neq', 'visibility', 'DRAFT']]));
  });
  test('TC33 – Đăng video khi chưa đăng nhập → lỗi yêu cầu đăng nhập', async () => {
    await expect(createVideoPost({ videoUri: 'file:///a.mp4', title: 'T', description: '', visibility: 'PUBLIC' }))
      .rejects.toThrow('Please sign in before posting a video.');
  });
  test('TC34 – Lỗi khi lưu bản ghi video → xóa file đã upload (dọn dẹp), ném lỗi', async () => {
    auth.users.push({ id: uid(9), email: 'p@x.y', password: 'p', confirmed: true, otp: '', user_metadata: {} });
    auth.session = { user: auth.users[0] };
    (global as any).fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
    failNext('videos', 'insert', { code: '500', message: 'insert failed' });
    await expect(createVideoPost({ videoUri: 'file:///clip.mov', coverUri: 'file:///c.png', title: ' T ', description: '', visibility: 'PUBLIC' }))
      .rejects.toMatchObject({ message: 'insert failed' });
    expect(storage.removed).toHaveLength(2);
    expect(storage.files.size).toBe(0);
  });
  test('TC35 – Nhãn lượt xem 999 999 phải hiển thị "1.0M views"', async () => {
    const u = seedUser('U');
    seedVideo(u, { views_count: 999_999 });
    const [v] = await getTrendingVideos(10);
    expect(v.views).toBe('1.0M views');
  });
});

describe('draftsStore', () => {
  test('TC36 – Lưu bản nháp không cần tiêu đề: tên mặc định, thời lượng m:ss', async () => {
    const d = await draftsStore.addDraft({ videoUrl: 'file:///rec.mp4', durationSeconds: 75.9, title: '   ' });
    expect(d.title).toBe('Untitled recording');
    expect(d.duration).toBe('1:15');
    expect(d.id).toMatch(/^local-/);
    expect(draftsStore.getState().drafts[0].id).toBe(d.id);
  });
  test('TC37 – Xuất bản bản nháp: chuyển sang publishedVideos và xóa khỏi danh sách nháp', async () => {
    const d = await draftsStore.addDraft({ videoUrl: 'file:///rec2.mp4', title: 'My clip' });
    const p = draftsStore.publishDraft(d.id)!;
    expect(p.title).toBe('My clip');
    expect(draftsStore.getState().drafts.find((x) => x.id === d.id)).toBeUndefined();
    expect(draftsStore.publishDraft('not-exist')).toBeNull();
  });
});
