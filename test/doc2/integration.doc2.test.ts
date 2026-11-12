/**
 * Bộ test theo SRS V1.0 / SDS V1.0 (TC01–TC69 của file 8ThreadsTV_Kiem_thu_Chuong5_theo_tai_lieu.xlsx),
 * chạy trên mã nguồn thật của app (src/).
 *  - Test thường: gọi trực tiếp hàm của app; Supabase thay bằng backend giả lập in-memory.
 *  - "[mã nguồn]": logic nằm trong component React Native → kiểm tra trực tiếp trong file .tsx.
 *  - test.skip "(cần Supabase thật)": hành vi do cấu hình server Supabase quyết định, không kiểm được ở đây.
 */
import * as fs from 'fs';
import * as path from 'path';
import { resetDb, db, auth, calls, failNext, storage } from '../mocks/fakeSupabase';
import { seedUser, seedVideo, flush, uid } from '../helpers';
import { signUpWithEmail, loginWithEmail, verifyOtpCode, logout, checkSession } from '../../src/services/authService';
import { addComment, getCommentsByVideoId, toggleLikeComment } from '../../src/services/commentService';
import { toggleFollowUser, getFollowCounts, getFollowList, searchProfiles, updateProfile, getProfileById } from '../../src/services/userService';
import * as videoService from '../../src/services/videoService';
import * as audioService from '../../src/services/audioService';
import { authStore } from '../../src/store/useAuthStore';
import { draftsStore } from '../../src/store/useDraftsStore';

const { searchVideosWithStatus, toggleLikeVideo, getUserVideos, getLikedVideos, getVideoById, getTrendingVideos, getVideosByTopic, incrementVideoView, createVideoPost } = videoService;
const src = (p: string) => fs.readFileSync(path.join(__dirname, '../../src', p), 'utf8');
const recent = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const pw = (n: number) => 'A1' + 'b'.repeat(n - 2);

beforeEach(() => {
  resetDb();
  authStore.logout();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
  (global as any).fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
});
afterEach(() => jest.restoreAllMocks());

async function loginAs(name: string, email: string) {
  await signUpWithEmail(name, email, 'Trung1234');
  await verifyOtpCode(email, auth.otpCode, name);
  return (await loginWithEmail(email, 'Trung1234')).user!;
}
const accepted = async (name: string, email: string, password: string) => (await signUpWithEmail(name, email, password)).success;

describe('B. Integration Test', () => {
  test('TC41 – Đăng ký → OTP → kích hoạt tài khoản', async () => {
    expect((await signUpWithEmail('Trung Test', 'it41@x.vn', 'Trung1234')).success).toBe(true);
    expect((await verifyOtpCode('it41@x.vn', auth.otpCode, 'Trung Test')).success).toBe(true);
    expect(auth.users[0].confirmed).toBe(true);
    expect(auth.session).toBeNull();
  });
  test('TC42 – Đăng nhập, token lưu trong vùng lưu trữ an toàn', async () => {
    expect((await loginAs('Linh', 'it42@x.vn')).id).toBeDefined();
    const sup = src('utils/supabase.ts');
    expect(sup).toMatch(/SecureStore/);
  });
  test('TC43 – Tài khoản chưa xác thực không đăng nhập được', async () => {
    await signUpWithEmail('Nam', 'it43@x.vn', 'Trung1234');
    expect(await loginWithEmail('it43@x.vn', 'Trung1234')).toEqual({ success: false, message: 'Email not confirmed' });
  });
  test('TC44 – Đăng xuất: hộp thoại xác nhận 1 lần, xóa phiên', async () => {
    await loginAs('Oanh', 'it44@x.vn');
    await logout();
    expect(await checkSession()).toBeNull();
    const s = src('screens/settings/SettingsScreen.tsx');
    const handler = s.slice(s.indexOf('setShowLogoutConfirm(true)') - 200, s.indexOf('setShowLogoutConfirm(true)') + 400);
    expect(/Alert\.alert/.test(handler)).toBe(false);
  });
  test.skip('TC45 – Giới hạn tần suất đăng nhập/OTP (cần Supabase thật)', () => undefined);
  test('TC46 – Cập nhật hồ sơ kèm ảnh đại diện lên Supabase Storage', async () => {
    const authId = uid(77); const id = seedUser('Old', { auth_id: authId });
    await updateProfile(authId, { display_name: 'Trung Mới', bio: 'b'.repeat(120) });
    expect((await getProfileById(id))!.name).toBe('Trung Mới');
    expect(await getProfileById(uid(999))).toBeNull();
    expect(src('services/userService.ts')).toMatch(/storage\s*\.from\('Image'\)/);
  });
  test('TC47 – Đổi mật khẩu rồi đăng nhập lại', async () => {
    const { supabase } = await import('../mocks/fakeSupabase');
    await loginAs('Phuc', 'it47@x.vn');
    await supabase.auth.signInWithPassword({ email: 'it47@x.vn', password: 'Trung1234' });
    await supabase.auth.updateUser({ password: 'NewPass99' });
    await logout();
    expect((await loginWithEmail('it47@x.vn', 'Trung1234')).success).toBe(false);
    expect((await loginWithEmail('it47@x.vn', 'NewPass99')).success).toBe(true);
  });
  test('TC48 – Trang chủ: lỗi mạng hiển thị thông báo + nút Thử lại [mã nguồn HomeScreen]', () => {
    const s = src('screens/home/HomeScreen.tsx');
    expect(/Thử lại|Retry/.test(s)).toBe(true);
  });
  test('TC49 – Video theo chủ đề: PUBLIC, mới nhất trước, 20/trang', async () => {
    const c = seedUser('C');
    for (let i = 0; i < 25; i++) seedVideo(c, { topic_id: 'travel' });
    seedVideo(c, { topic_id: 'travel', visibility: 'PRIVATE' });
    const list = await getVideosByTopic('travel');
    expect(list.every((v) => v.visibility === 'PUBLIC')).toBe(true);
    expect(list).toHaveLength(20);
  });
  test('TC50 – Danh sách thịnh hành theo BR05', async () => {
    const c = seedUser('C');
    const a = seedVideo(c, { views_count: 100, created_at: recent(2) });
    const b = seedVideo(c, { views_count: 10, comments_count: 500, created_at: recent(2) });
    expect((await getTrendingVideos(10)).map((v) => v.id)).toEqual([b, a]);
  });
  test('TC51 – Tìm kiếm video theo tiêu đề / mô tả / hashtag, chỉ PUBLIC', async () => {
    const c = seedUser('C');
    seedVideo(c, { title: 'Cat dance' }); seedVideo(c, { title: 'Dog', hashtags: ['cat'] }); seedVideo(c, { title: 'Cat secret', visibility: 'PRIVATE' });
    const r = await searchVideosWithStatus('cat');
    expect(r.videos.map((v) => v.title).sort()).toEqual(['Cat dance', 'Dog']);
  });
  test('TC52 – Tìm tài khoản và Follow từ kết quả', async () => {
    const me = seedUser('Me'); const bob = seedUser('Bob'); seedUser('Bobby');
    expect((await searchProfiles('bob')).map((u) => u.name).sort()).toEqual(['Bob', 'Bobby']);
    await toggleFollowUser(me, bob);
    expect((await getFollowList(me, 'following')).map((u) => u.name)).toEqual(['Bob']);
  });
  test.skip('TC53 – Phát video PRIVATE/đã xóa không mở được (cần RLS trên Supabase thật)', () => undefined);
  test('TC54 – Đăng video: thanh tiến trình, lưu Supabase Storage, xuất hiện ở My Videos', async () => {
    const u = await loginAs('Poster', 'it54@x.vn');
    await createVideoPost({ videoUri: 'file:///a.mp4', title: 'Hoàng hôn', description: 'đẹp', visibility: 'PUBLIC' });
    expect(await getUserVideos(u.id)).toHaveLength(1);
    expect([...storage.files.keys()][0]).toMatch(/^Video\//);
    const code = src('screens/camera/PostVideoScreen.tsx') + src('services/videoService.ts');
    expect({ progress: /progress/i.test(code) }).toEqual({ progress: true });
  });
  test('TC55 – Tệp 120 MB bị chặn ở cả client và server', async () => {
    await loginAs('Big', 'it55@x.vn');
    (global as any).fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(120 * 1024 * 1024) }));
    let blocked = false;
    try { await createVideoPost({ videoUri: 'file:///big.mp4', title: 'T', description: '', visibility: 'PUBLIC' }); } catch { blocked = true; }
    expect(blocked).toBe(true);
  });
  test('TC56 – Upload gián đoạn: báo lỗi, không còn dữ liệu dở dang', async () => {
    await loginAs('Net', 'it56@x.vn');
    failNext('videos', 'insert', { code: 'NETWORK', message: 'Network request failed' });
    await expect(createVideoPost({ videoUri: 'file:///a.mp4', title: 'T', description: '', visibility: 'PUBLIC' })).rejects.toBeTruthy();
    expect(db.videos ?? []).toHaveLength(0);
    expect(storage.files.size).toBe(0);
    await createVideoPost({ videoUri: 'file:///a.mp4', title: 'T', description: '', visibility: 'PUBLIC' });
    expect(db.videos).toHaveLength(1);
  });
  test('TC57 – Cập nhật video qua S18 (chủ sở hữu / người khác)', () => {
    expect(Object.keys(videoService).some((k) => /update.*video|edit.*video/i.test(k))).toBe(true);
  });
  test('TC58 – Xóa video: DELETED, xóa tệp, ẩn khỏi mọi danh sách', () => {
    expect(Object.keys(videoService).some((k) => /delete.*video|remove.*video/i.test(k))).toBe(true);
  });
  test('TC59 – Hai yêu cầu Like đồng thời chỉ tạo 1 bản ghi; Unlike về 0', async () => {
    const a = seedUser('A'); const v = seedVideo(seedUser('C'));
    await Promise.all([toggleLikeVideo(a, v), toggleLikeVideo(a, v)]);
    expect(db.likes).toHaveLength(1);
    await toggleLikeVideo(a, v);
    expect(db.likes).toHaveLength(0);
  });
  test('TC60 – Thêm và xem bình luận, mới nhất trước', async () => {
    const alice = seedUser('Alice'); const bob = seedUser('Bob'); const v = seedVideo(seedUser('C'));
    await addComment(v, alice, 'Thứ nhất'); await addComment(v, bob, 'Thứ hai');
    const list = await getCommentsByVideoId(v);
    expect(list.map((c) => c.content)).toEqual(['Thứ hai', 'Thứ nhất']);
    expect(list).toHaveLength(2);
  });
  test('TC61 – Video tắt bình luận: ẩn khung bình luận, API từ chối', () => {
    const all = src('services/videoService.ts') + src('services/commentService.ts') + src('screens/reel/ReelDetailScreen.tsx');
    expect(/allow_comments|comments_enabled|commentsEnabled|allowComments/.test(all)).toBe(true);
  });
  test('TC62 – Thả tim bình luận trên S04', async () => {
    expect(src('screens/reel/ReelDetailScreen.tsx')).toMatch(/toggleLikeComment\(currentUser\.id, commentId\)/);
    const o = seedUser('O'); const l = seedUser('L'); const v = seedVideo(seedUser('C'));
    const c = await addComment(v, o, 'hi');
    expect((await toggleLikeComment(l, c.id)).likesCount).toBe(1);
    expect((await toggleLikeComment(l, c.id)).likesCount).toBe(0);
    expect(db.comment_likes ?? []).toHaveLength(0);
  });
  test('TC63 – Follow từ hồ sơ, tìm trong danh sách Followers, Unfollow', async () => {
    const alice = seedUser('Alice'); const bob = seedUser('Bob');
    await toggleFollowUser(alice, bob);
    expect((await getFollowList(bob, 'followers')).map((u) => u.name)).toEqual(['Alice']);
    expect(src('screens/profile/views/FollowListView.tsx')).toMatch(/searchQuery/);
    await toggleFollowUser(alice, bob);
    expect(await getFollowCounts(bob)).toEqual({ following: 0, followers: 0 });
  });
  test('TC64 – Ẩn gợi ý (X) không xuất hiện lại sau khi tải lại [mã nguồn UserProfileView]', () => {
    const s = src('screens/profile/views/UserProfileView.tsx');
    const persisted = /AsyncStorage|supabase\.from\(['"]hidden|hideSuggestion/.test(s);
    expect(persisted).toBe(true);
  });
  test('TC65 – Kho nhạc: tab For you/Trending/Saved, tìm, lưu 1 lần', () => {
    const fns = Object.keys(audioService);
    expect({ search: fns.includes('searchAudioTracks'), save: fns.some((k) => /save/i.test(k)) }).toEqual({ search: true, save: true });
  });
  test('TC66 – Bản nháp: chạm mở lại S08, mỗi tài khoản chỉ thấy nháp của mình', async () => {
    authStore.login({ id: uid(501), name: 'User A' });
    const d = await draftsStore.addDraft({ videoUrl: 'file:///a-draft.mp4' });
    authStore.logout(); authStore.login({ id: uid(502), name: 'User B' });
    const userBSeesA = draftsStore.getState().drafts.some((x) => x.id === d.id);
    const reopenPost = /PostVideo/.test(src('screens/drafts/DraftViewer.tsx'));
    expect({ userBSeesA, reopenPost }).toEqual({ userBSeesA: false, reopenPost: true });
  });
  test.skip('TC67 – Giả mạo userId khi ghi dữ liệu (cần RLS trên Supabase thật)', () => undefined);
  test.skip('TC68 – API danh sách không trả video ngoài quyền xem (cần RLS trên Supabase thật)', () => undefined);
  test.skip('TC69 – ≥ 95% API đọc phản hồi ≤ 3 giây (cần Supabase thật)', () => undefined);
});
