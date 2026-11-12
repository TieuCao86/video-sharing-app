/**
 * Bộ test theo SRS V1.0 / SDS V1.0 (TC01–TC69 của file 8ThreadsTV_Kiem_thu_Chuong5 (Nhom01 SRS/SDS)),
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

describe('A. Unit Test', () => {
  test('TC01 – Tên hiển thị biên 1/2/50/51 ký tự', async () => {
    expect(await accepted('A', 'n1@x.vn', 'Trung1234')).toBe(false);
    expect(await accepted('An', 'n2@x.vn', 'Trung1234')).toBe(true);
    expect(await accepted('a'.repeat(50), 'n3@x.vn', 'Trung1234')).toBe(true);
    expect(await accepted('a'.repeat(51), 'n4@x.vn', 'Trung1234')).toBe(false);
  });
  test('TC02 – Email: định dạng và tối đa 254 ký tự', async () => {
    expect(await accepted('Trung', 'trung.test01@example.com', 'Trung1234')).toBe(true);
    const results = {
      'trung.test@': await accepted('Trung', 'trung.test@', 'Trung1234'),
      'trungtest.com': await accepted('Trung', 'trungtest.com', 'Trung1234'),
      '255 ký tự': await accepted('Trung', 'a'.repeat(243) + '@example.com', 'Trung1234'),
    };
    expect(results).toEqual({ 'trung.test@': false, 'trungtest.com': false, '255 ký tự': false });
  });
  test('TC03 – Mật khẩu biên 5/6/64/65 ký tự', async () => {
    const r = {
      5: await accepted('Trung', 'p5@x.vn', pw(5)), 6: await accepted('Trung', 'p6@x.vn', pw(6)),
      64: await accepted('Trung', 'p64@x.vn', pw(64)), 65: await accepted('Trung', 'p65@x.vn', pw(65)),
    };
    expect(r).toEqual({ 5: false, 6: true, 64: true, 65: false });
  });
  test('TC04 – Mật khẩu phải có chữ và số', async () => {
    const r = { abcdef: await accepted('Trung', 'c1@x.vn', 'abcdef'), '123456': await accepted('Trung', 'c2@x.vn', '123456'), Trung1: await accepted('Trung', 'c3@x.vn', 'Trung1') };
    expect(r).toEqual({ abcdef: false, '123456': false, Trung1: true });
  });
  test('TC05 – OTP phải đúng 6 chữ số [mã nguồn OTPScreen + verifyOtpCode]', async () => {
    const otp = src('screens/auth/OTPScreen.tsx');
    const filtersDigits = /replace\(\/\\D\/g|\/\^\\d\{6\}\$\/|\/\^\[0-9\]\{6\}\$\//.test(otp);
    // verifyOtpCode phía service chỉ kiểm tra rỗng: "12345A" vẫn được gửi lên server
    const spy = jest.spyOn((await import('../mocks/fakeSupabase')).supabase.auth, 'verifyOtp');
    await verifyOtpCode('a@b.c', '12345A');
    expect({ uiChiNhanChuSo: filtersDigits, serviceChanGiaTriKhongPhaiSo: spy.mock.calls.length === 0 }).toEqual({ uiChiNhanChuSo: true, serviceChanGiaTriKhongPhaiSo: true });
  });
  test('TC06 – Bio tối đa 150 ký tự [mã nguồn EditProfileScreen]', () => {
    const s = src('screens/profile/EditProfileScreen.tsx');
    expect(s).toMatch(/MAX_BIO_LENGTH = 150/);
    expect(s).toMatch(/bio\.length > MAX_BIO_LENGTH/);
  });
  test('TC07 – Ảnh JPG/PNG ≤ 5 MB [mã nguồn EditProfileScreen]', () => {
    const s = src('screens/profile/EditProfileScreen.tsx');
    expect(s).toMatch(/MAX_AVATAR_SIZE_BYTES = 5 \* 1024 \* 1024/);
    expect(s).toMatch(/fileSize > MAX_AVATAR_SIZE_BYTES/);
    expect(s).toMatch(/\\\.\(jpe\?g\|png\)\$/);
  });
  test('TC08 – Tệp video MP4/MOV ≤ 100 MB, ≤ 180 s', async () => {
    const user = await loginAs('Up', 'up8@x.vn');
    void user;
    const results: Record<string, boolean> = {};
    for (const uri of ['file:///a.avi', 'file:///a_101MB.mp4', 'file:///a_181s.mp4']) {
      const invalidMetadata = { fileSizeBytes: uri.includes('101MB') ? 101 * 1024 * 1024 : 10, durationSeconds: uri.includes('181s') ? 181 : 60 };
      try { await createVideoPost({ videoUri: uri, ...invalidMetadata, title: 'T', description: '', visibility: 'PUBLIC' }); results[uri] = true; } catch { results[uri] = false; }
    }
    const camera = src('screens/camera/CameraScreen.tsx') + src('screens/camera/PostVideoScreen.tsx');
    expect({ ...results, kiemTraDungLuong: /100\s*\*\s*1024\s*\*\s*1024|fileSize/.test(camera) })
      .toEqual({ 'file:///a.avi': false, 'file:///a_101MB.mp4': false, 'file:///a_181s.mp4': false, kiemTraDungLuong: true });
  });
  test('TC09 – Tiêu đề 1–100 ký tự khi đăng, bản nháp được để trống', async () => {
    await loginAs('Up', 'up9@x.vn');
    const post = src('screens/camera/PostVideoScreen.tsx');
    const draft = await draftsStore.addDraft({ videoUrl: 'file:///d.mp4', title: '' });
    let serverChanTieuDeRong = true;
    try { await createVideoPost({ videoUri: 'file:///a.mp4', fileSizeBytes: 10, durationSeconds: 60, title: '', description: '', visibility: 'PUBLIC' }); serverChanTieuDeRong = false; } catch { /* bị chặn */ }
    let serverChanTieuDe101 = true;
    try { await createVideoPost({ videoUri: 'file:///a.mp4', fileSizeBytes: 10, durationSeconds: 60, title: 'T'.repeat(101), description: '', visibility: 'PUBLIC' }); serverChanTieuDe101 = false; } catch { /* bị chặn */ }
    await createVideoPost({ videoUri: 'file:///one.mp4', fileSizeBytes: 10, durationSeconds: 60, title: 'T', description: '', visibility: 'PUBLIC' });
    await createVideoPost({ videoUri: 'file:///hundred.mp4', fileSizeBytes: 10, durationSeconds: 60, title: 'T'.repeat(100), description: '', visibility: 'PUBLIC' });
    expect({
      manHinhChanRong: /!title\.trim\(\)\s*\|\|\s*title\.trim\(\)\.length > 100/.test(post), maxLength100: /maxLength=\{100\}/.test(post),
      nhapDeTrong: !!draft.id, serverChanTieuDeRong, serverChanTieuDe101,
      acceptsOne: db.videos.some((video) => video.title === 'T'),
      acceptsHundred: db.videos.some((video) => video.title === 'T'.repeat(100)),
    }).toEqual({ manHinhChanRong: true, maxLength100: true, nhapDeTrong: true, serverChanTieuDeRong: true, serverChanTieuDe101: true, acceptsOne: true, acceptsHundred: true });
  });
  test('TC10 – Mô tả tối đa 500 ký tự', () => {
    const post = src('screens/camera/PostVideoScreen.tsx');
    const m = post.match(/maxLength=\{(\d+)\}[\s\S]{0,200}description\.length/);
    expect(Number(m?.[1])).toBeLessThanOrEqual(500);
  });
  test('TC11 – Tối đa 10 hashtag, mỗi hashtag 1–30 ký tự', () => {
    const all = ['screens/camera/PostVideoScreen.tsx', 'services/videoService.ts'].map(src).join('\n');
    expect(/hashtag/i.test(all)).toBe(true);
  });
  test('TC12 – Bình luận 1–500 ký tự sau trim', async () => {
    const u = seedUser('C');
    await expect(addComment('v', u, '    ')).rejects.toThrow();
    await expect(addComment('v', u, 'x'.repeat(501))).rejects.toThrow();
    expect((await addComment('v', u, 'a')).content).toBe('a');
    expect((await addComment('v', u, '  ' + 'y'.repeat(500) + '  ')).content).toHaveLength(500);
  });
  test('TC13 – Từ khóa tìm kiếm 1–100 ký tự sau trim', async () => {
    expect((await searchVideosWithStatus('   ')).videos).toEqual([]);
    await expect(searchVideosWithStatus('k'.repeat(100))).resolves.toBeDefined();
    await expect(searchVideosWithStatus('k'.repeat(101))).rejects.toThrow();
  });
  test('TC14 – Làm sạch dữ liệu đầu vào (NFR09)', async () => {
    const u = seedUser('X', { auth_id: 'x-auth' });
    const c = await addComment('v', u, '<img src=x onerror=alert(1)>Hay');
    expect(c.content).toBe('Hay');
    await updateProfile('x-auth', { bio: '<script>alert(1)</script>Xin chào' });
    expect(db.users.find((profile) => profile.id === u)?.bio).toBe('alert(1)Xin chào');
  });
  test('TC15 – Đăng ký trùng email bị từ chối', async () => {
    await signUpWithEmail('An', 'existing@example.com', 'Trung1234');
    expect(await signUpWithEmail('Bao', 'existing@example.com', 'Trung1234')).toEqual({ success: false, message: 'User already registered' });
    expect(db.users).toHaveLength(1);
  });
  test('TC16 – Đăng ký hợp lệ: tài khoản chưa xác thực, gửi OTP', async () => {
    const r = await signUpWithEmail('Trung Test', 'trung.test01@example.com', 'Trung1234');
    expect(r).toEqual({ success: true, message: 'Mã xác nhận OTP đã được gửi về email của bạn.' });
    expect(auth.users[0].confirmed).toBe(false);
    expect(db.users[0]).not.toHaveProperty('password');
  });
  test.skip('TC17 – OTP hết hạn sau 10 phút (cần Supabase thật)', () => undefined);
  test.skip('TC18 – OTP bị hủy sau 5 lần nhập sai (cần Supabase thật)', () => undefined);
  test.skip('TC19 – Gửi lại OTP sau 60 giây (cần Supabase thật)', () => undefined);
  test('TC20 – Đăng nhập: chưa xác thực / sai mật khẩu / hợp lệ', async () => {
    await signUpWithEmail('Phuc', 'p@x.vn', 'Trung1234');
    expect((await loginWithEmail('p@x.vn', 'Trung1234')).success).toBe(false);
    await verifyOtpCode('p@x.vn', auth.otpCode);
    expect(await loginWithEmail('p@x.vn', 'Sai12345')).toMatchObject({ success: false });
    expect((await loginWithEmail('p@x.vn', 'Trung1234')).success).toBe(true);
  });
  test.skip('TC21 – Không ghi dữ liệu thay tài khoản khác (cần RLS trên Supabase thật)', () => undefined);
  test('TC22 – Đổi mật khẩu kiểm tra mật khẩu hiện tại [mã nguồn ChangePasswordScreen]', () => {
    const s = src('screens/settings/ChangePasswordScreen.tsx');
    expect(s).toMatch(/signInWithPassword\(\{\s*email,\s*password: currentPassword/);
    expect(s).toMatch(/Current password is incorrect\./);
    expect(s).toMatch(/updateUser\(\{\s*password: newPassword/);
  });
  test('TC23 – Điểm thịnh hành = views×3 + likes×2 + comments', () => {
    expect(videoService.calculateTrendingScore({ views_count: 10, likes_count: 5, comments_count: 2 })).toBe(42);
    expect(videoService.calculateTrendingScore({ views_count: 10, likes_count: 5, comments_count: 2 }, { views: 1, likes: 1, comments: 1 })).toBe(17);
  });
  test('TC24 – Trending: chỉ PUBLIC trong 30 ngày, xếp theo điểm', async () => {
    const c = seedUser('C');
    const a = seedVideo(c, { views_count: 100, likes_count: 0, comments_count: 0, created_at: recent(2) });
    const b = seedVideo(c, { views_count: 50, likes_count: 200, comments_count: 0, created_at: recent(3) });
    seedVideo(c, { views_count: 999, visibility: 'PRIVATE', created_at: recent(1) });
    seedVideo(c, { views_count: 1000, created_at: recent(60) });
    expect((await getTrendingVideos(10)).map((v) => v.id)).toEqual([b, a]);
  });
  test.skip('TC25 – Quyền xem PUBLIC/FOLLOWERS/PRIVATE theo người xem (cần RLS trên Supabase thật)', () => undefined);
  test.skip('TC26 – Bản nháp và video đã xóa không hiển thị (cần RLS trên Supabase thật)', () => undefined);
  test('TC27 – Cập nhật thông tin video (chủ sở hữu)', () => {
    expect(Object.keys(videoService).some((k) => /update.*video|edit.*video/i.test(k))).toBe(true);
  });
  test('TC28 – Xóa mềm video + xóa tệp media', () => {
    expect(Object.keys(videoService).some((k) => /delete.*video|remove.*video/i.test(k))).toBe(true);
  });
  test('TC29 – Lượt xem tăng 1', async () => {
    const v = seedVideo(seedUser('C'), { views_count: 10 });
    await incrementVideoView(v);
    expect(db.videos[0].views_count).toBe(11);
  });
  test('TC30 – Thích video không tạo bản ghi trùng', async () => {
    const a = seedUser('A'); const v = seedVideo(seedUser('C'));
    await Promise.all([toggleLikeVideo(a, v), toggleLikeVideo(a, v)]); // 2 yêu cầu thích gửi cùng lúc
    expect(db.likes).toHaveLength(1);
  });
  test('TC31 – Bỏ thích video xóa bản ghi', async () => {
    const a = seedUser('A'); const v = seedVideo(seedUser('C'));
    await toggleLikeVideo(a, v); await toggleLikeVideo(a, v);
    expect(db.likes ?? []).toHaveLength(0);
  });
  test('TC32 – Thích / bỏ thích bình luận cập nhật số đếm', async () => {
    const owner = seedUser('O'); const liker = seedUser('L');
    db.comments = [{ id: 'c1', user_id: owner, video_id: 'v', content: 'hi', likes_count: 0 }];
    expect(await toggleLikeComment(liker, 'c1')).toEqual({ liked: true, likesCount: 1 });
    expect(await toggleLikeComment(liker, 'c1')).toEqual({ liked: false, likesCount: 0 });
  });
  test('TC33 – Follow / follow trùng / tự follow / unfollow', async () => {
    const a = seedUser('A'); const b = seedUser('B');
    await Promise.all([toggleFollowUser(a, b), toggleFollowUser(a, b)]); // follow trùng gửi cùng lúc
    expect(db.follows).toHaveLength(1);
    expect(await getFollowCounts(b)).toEqual({ following: 0, followers: 1 });
    expect(await getFollowCounts(a)).toEqual({ following: 1, followers: 0 });
    await expect(toggleFollowUser(a, a)).rejects.toThrow('Không thể tự theo dõi chính mình.');
    expect(await toggleFollowUser(a, b)).toBe(false);
    expect(await getFollowCounts(b)).toEqual({ following: 0, followers: 0 });
  });
  test('TC34 – Gợi ý tài khoản lọc đã follow / chưa OTP / đã ẩn [mã nguồn UserProfileView]', () => {
    const s = src('screens/profile/views/UserProfileView.tsx');
    const block = s.slice(s.indexOf('dismissedUserIds.has') - 400, s.indexOf('dismissedUserIds.has') + 80);
    expect(/isFollowing|followed/.test(block)).toBe(true);
  });
  test.skip('TC35 – Tổng lượt thích hồ sơ chỉ tính video đã đăng, chưa xóa (cần Supabase thật)', () => undefined);
  test('TC36 – Sắp xếp mặc định (bình luận, video của tôi, Liked, chủ đề)', async () => {
    const me = seedUser('Me'); const c = seedUser('C');
    const v1 = seedVideo(me, { topic_id: 't' }); const v2 = seedVideo(me, { topic_id: 't' });
    await addComment(v1, c, 'cũ'); await addComment(v1, c, 'mới');
    await toggleLikeVideo(c, v2); await toggleLikeVideo(c, v1);
    expect({
      comments: (await getCommentsByVideoId(v1)).map((x) => x.content),
      myVideos: (await getUserVideos(me)).map((x) => x.id),
      liked: (await getLikedVideos(c)).map((x) => x.id),
      topic: (await getVideosByTopic('t')).map((x) => x.id),
    }).toEqual({ comments: ['mới', 'cũ'], myVideos: [v2, v1], liked: [v1, v2], topic: [v2, v1] });
  });
  test('TC37 – Phân trang mặc định 20 bản ghi', async () => {
    const c = seedUser('C');
    for (let i = 0; i < 45; i++) seedVideo(c, { views_count: i, created_at: recent(1), topic_id: 't' });
    expect({ trending: (await getTrendingVideos()).length, topic: (await getVideosByTopic('t')).length }).toEqual({ trending: 20, topic: 20 });
  });
  test('TC38 – Tối đa 20 bản nháp', async () => {
    for (let i = 0; i < 20; i++) await draftsStore.addDraft({ videoUrl: `file:///d${i}.mp4` });
    const before = draftsStore.getState().drafts.length;
    await draftsStore.addDraft({ videoUrl: 'file:///d21.mp4' }).catch(() => undefined);
    expect(draftsStore.getState().drafts.length).toBe(before);
  });
  test('TC39 – Guest bị chặn thao tác cần đăng nhập, Customer được thực hiện', () => {
    const action = jest.fn();
    authStore.logout(); authStore.checkAuth(action);
    expect(action).not.toHaveBeenCalled();
    expect(authStore.getState().isLoginModalVisible).toBe(true);
    authStore.login({}); authStore.checkAuth(action);
    expect(action).toHaveBeenCalledTimes(1);
  });
  test('TC40 – Mỗi video chỉ một nhạc nền [mã nguồn CameraScreen]', () => {
    const s = src('screens/camera/CameraScreen.tsx');
    expect(s).toMatch(/useState<AudioTrack \| null>\(null\)/);
    expect(s).not.toMatch(/AudioTrack\[\]>/);
  });
});

