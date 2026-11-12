/**
 * INTEGRATION TEST – nhiều module thật của app phối hợp với nhau qua lớp API Supabase:
 *   Service (authService / userService / videoService / commentService / notificationService / authStore)
 *     → Supabase client API (auth, PostgREST, storage, edge function)
 *       → Cơ sở dữ liệu (giả lập in-memory: bảng users, videos, likes, follows, comments, comment_likes, notifications
 *          với ràng buộc UNIQUE như schema thật).
 * Mỗi test là một luồng nghiệp vụ end-to-end, kiểm tra dữ liệu cuối cùng trong DB và dữ liệu trả về cho giao diện.
 */
import { resetDb, db, auth, functionsCfg, storage } from '../mocks/fakeSupabase';
import { seedUser, seedVideo, flush } from '../helpers';
import { signUpWithEmail, verifyOtpCode, loginWithEmail, checkSession, logout } from '../../src/services/authService';
import { toggleFollowUser, getFollowCounts, getFollowList, searchProfiles, updateProfile, getProfileById } from '../../src/services/userService';
import { toggleLikeVideo, getVideoById, getTrendingVideos, getUserVideos, getLikedVideos, searchVideosWithStatus, createVideoPost } from '../../src/services/videoService';
import { addComment, getCommentsByVideoId, toggleLikeComment } from '../../src/services/commentService';
import { getNotifications, markAllNotificationsAsRead } from '../../src/services/notificationService';
import { authStore } from '../../src/store/useAuthStore';

beforeEach(() => {
  resetDb();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.spyOn(console, 'log').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('Luồng tài khoản: App → Supabase Auth → bảng users', () => {
  test('TC38 – Đăng ký → xác thực OTP → đăng nhập → khôi phục phiên → đăng xuất', async () => {
    const reg = await signUpWithEmail('Trung Test', 'trung.it01@example.com', 'Trung1234');
    expect(reg.success).toBe(true);
    const otp = await verifyOtpCode('trung.it01@example.com', auth.otpCode, 'Trung Test');
    expect(otp.success).toBe(true);
    expect(auth.session).toBeNull(); // OTP xong phải đăng nhập lại

    const login = await loginWithEmail('trung.it01@example.com', 'Trung1234');
    expect(login.success).toBe(true);
    expect(login.user!.name).toBe('Trung Test');
    expect(db.users).toHaveLength(1);

    const restored = await checkSession();
    expect(restored!.id).toBe(login.user!.id);

    await logout();
    expect(authStore.getState().isLoggedIn).toBe(false);
    expect(await checkSession()).toBeNull();
  });

  test('TC39 – Đăng nhập khi chưa xác thực OTP bị từ chối (BR12)', async () => {
    await signUpWithEmail('Chua Xac Thuc', 'pending@example.com', 'Trung1234');
    const r = await loginWithEmail('pending@example.com', 'Trung1234');
    expect(r).toEqual({ success: false, message: 'Email not confirmed' });
  });

  test('TC40 – Cập nhật hồ sơ rồi đọc lại hồ sơ hiển thị dữ liệu mới', async () => {
    const authId = '0000aaaa-0000-4000-8000-00000000aaaa';
    const id = seedUser('Old Name', { auth_id: authId });
    await updateProfile(authId, { display_name: 'New Name', bio: 'Bio mới' });
    const p = await getProfileById(id);
    expect(p).toMatchObject({ name: 'New Name', bio: 'Bio mới' });
  });
});

describe('Luồng mạng xã hội: follow / like / comment → notifications', () => {
  test('TC41 – Follow: lưu quan hệ, cập nhật số đếm, tạo 1 thông báo cho người được follow; Unfollow giảm số đếm', async () => {
    const a = seedUser('Alice'); const b = seedUser('Bob');
    await toggleFollowUser(a, b);
    await flush();
    expect(await getFollowCounts(b)).toEqual({ following: 0, followers: 1 });
    expect(await getFollowCounts(a)).toEqual({ following: 1, followers: 0 });
    const notis = await getNotifications(b);
    expect(notis).toHaveLength(1);
    expect(notis[0]).toMatchObject({ type: 'follow', message: 'đã bắt đầu theo dõi bạn', sender: { name: 'Alice' } });

    await toggleFollowUser(a, b);
    expect(await getFollowCounts(b)).toEqual({ following: 0, followers: 0 });
  });

  test('TC42 – Follow → Unfollow → Follow lại không tạo thông báo follow trùng', async () => {
    const a = seedUser('Alice'); const b = seedUser('Bob');
    await toggleFollowUser(a, b); await flush();
    await toggleFollowUser(a, b);
    await toggleFollowUser(a, b); await flush();
    expect(db.follows).toHaveLength(1);
    expect(db.notifications.filter((n) => n.type === 'follow')).toHaveLength(1);
  });

  test('TC43 – Danh sách followers/following và cờ isFollowing trong tìm kiếm tài khoản', async () => {
    const a = seedUser('Alice'); const b = seedUser('Bob'); const c = seedUser('Bobby');
    await toggleFollowUser(a, b); await toggleFollowUser(c, b);
    const followers = await getFollowList(b, 'followers');
    expect(followers.map((u) => u.name).sort()).toEqual(['Alice', 'Bobby']);
    const following = await getFollowList(a, 'following');
    expect(following.map((u) => u.name)).toEqual(['Bob']);
    const found = await searchProfiles('bob');
    expect(found.map((u) => u.name).sort()).toEqual(['Bob', 'Bobby']);
  });

  test('TC44 – Like video: lưu like, isLiked = true, có trong tab Liked, chủ video nhận thông báo; Unlike gỡ hết', async () => {
    const me = seedUser('Me'); const creator = seedUser('Creator');
    const v = seedVideo(creator, { title: 'Sunset' });
    await toggleLikeVideo(me, v); await flush();
    expect((await getVideoById(v, me))!.isLiked).toBe(true);
    expect((await getLikedVideos(me)).map((x) => x.id)).toEqual([v]);
    expect((await getNotifications(creator))[0]).toMatchObject({ type: 'like', message: 'đã thích video của bạn' });

    await toggleLikeVideo(me, v);
    expect((await getVideoById(v, me))!.isLiked).toBe(false);
    expect(await getLikedVideos(me)).toEqual([]);
  });

  test('TC45 – Bình luận: lưu DB, danh sách hiển thị mới nhất trước kèm tên người viết, chủ video nhận thông báo', async () => {
    const a = seedUser('Alice'); const b = seedUser('Bob'); const creator = seedUser('Creator');
    const v = seedVideo(creator);
    await addComment(v, a, 'Bình luận thứ nhất');
    await addComment(v, b, 'Bình luận thứ hai');
    await flush();
    const list = await getCommentsByVideoId(v, a);
    expect(list.map((c) => c.content)).toEqual(['Bình luận thứ hai', 'Bình luận thứ nhất']);
    expect(list.map((c) => c.userName)).toEqual(['Bob', 'Alice']);
    const notis = await getNotifications(creator);
    expect(notis.filter((n) => n.type === 'comment')).toHaveLength(2);
  });

  test('TC46 – Thích bình luận: likes_count tăng, isLiked đúng, chủ bình luận nhận thông báo "thích bình luận"', async () => {
    const a = seedUser('Alice'); const b = seedUser('Bob'); const creator = seedUser('Creator');
    const v = seedVideo(creator);
    const c = await addComment(v, a, 'Hay quá');
    await toggleLikeComment(b, c.id); await flush();
    const [shown] = await getCommentsByVideoId(v, b);
    expect(shown).toMatchObject({ likesCount: 1, isLiked: true });
    const notis = await getNotifications(a);
    expect(notis).toHaveLength(1);
    expect(notis[0].message).toBe('đã thích bình luận của bạn');
  });

  test('TC47 – Đánh dấu tất cả thông báo đã đọc', async () => {
    const a = seedUser('Alice'); const b = seedUser('Bob');
    const v = seedVideo(b);
    await toggleLikeVideo(a, v); await addComment(v, a, 'ok'); await flush();
    await markAllNotificationsAsRead(b);
    expect((await getNotifications(b)).every((n) => n.isRead)).toBe(true);
  });
});

describe('Luồng video: danh sách, quyền riêng tư, tìm kiếm, đăng video', () => {
  test('TC48 – Trending theo BR05: điểm = views×3 + likes×2 + comments, chỉ PUBLIC trong 30 ngày, cờ isLiked đúng', async () => {
    const me = seedUser('Me'); const c = seedUser('Creator');
    const recent = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
    const a = seedVideo(c, { views_count: 100, likes_count: 0, comments_count: 0, created_at: recent(2) });   // điểm 300
    const b = seedVideo(c, { views_count: 50, likes_count: 200, comments_count: 0, created_at: recent(3) });  // điểm 550
    const k = seedVideo(c, { views_count: 10, likes_count: 0, comments_count: 500, created_at: recent(4) }); // điểm 530
    seedVideo(c, { views_count: 999, visibility: 'PRIVATE', created_at: recent(1) });                        // không PUBLIC
    seedVideo(c, { views_count: 1000, created_at: recent(60) });                                              // quá 30 ngày
    await toggleLikeVideo(me, b);
    const list = await getTrendingVideos(3, me);
    expect(list.map((v) => v.id)).toEqual([b, k, a]);
    expect(list.map((v) => v.isLiked)).toEqual([true, false, false]);
  });

  test('TC49 – Hồ sơ người khác không được lộ video PRIVATE/FOLLOWERS (BR02, NFR11)', async () => {
    const owner = seedUser('Owner');
    seedVideo(owner, { visibility: 'PUBLIC', title: 'pub' });
    seedVideo(owner, { visibility: 'PRIVATE', title: 'priv' });
    seedVideo(owner, { visibility: 'FOLLOWERS', title: 'fol' });
    seedVideo(owner, { visibility: 'DRAFT', title: 'draft' });
    seedVideo(owner, { visibility: 'DELETED', title: 'del' });
    const shown = (await getUserVideos(owner)).map((v) => v.title);
    expect(shown).not.toContain('draft');
    expect(shown).not.toContain('del');
    expect(shown).toEqual(['pub']);
  });

  test('TC50 – Tìm kiếm (fallback từ khóa) chỉ trả video PUBLIC khớp tiêu đề hoặc mô tả, không trùng lặp', async () => {
    const c = seedUser('Creator');
    seedVideo(c, { title: 'Cat dance', description: 'cat', views_count: 5 });
    seedVideo(c, { title: 'Dog', description: 'funny cat', views_count: 9 });
    seedVideo(c, { title: 'Cat secret', visibility: 'PRIVATE' });
    const r = await searchVideosWithStatus(' cat ');
    expect(r.mode).toBe('keyword');
    expect(r.videos.map((v) => v.title)).toEqual(['Dog', 'Cat dance']);
  });

  test('TC51 – Tìm kiếm ngữ nghĩa (edge function OK): giữ thứ tự id trả về, bỏ id không PUBLIC', async () => {
    const c = seedUser('Creator');
    const a = seedVideo(c); const b = seedVideo(c); const p = seedVideo(c, { visibility: 'PRIVATE' });
    functionsCfg.error = null;
    functionsCfg.response = { videoIds: [b, p, a, b] };
    const r = await searchVideosWithStatus('anything');
    expect(r.mode).toBe('hybrid');
    expect(r.videos.map((v) => v.id)).toEqual([b, a]);
  });

  test('TC52 – Đăng video: upload storage → tạo bản ghi videos → xuất hiện trong "My Videos"', async () => {
    await signUpWithEmail('Poster', 'poster@example.com', 'Trung1234');
    await verifyOtpCode('poster@example.com', auth.otpCode, 'Poster');
    const login = await loginWithEmail('poster@example.com', 'Trung1234');
    (global as any).fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) }));
    await createVideoPost({ videoUri: 'file:///rec/clip.mp4', title: '  Hoàng hôn  ', description: ' đẹp ', visibility: 'PUBLIC' });
    expect([...storage.files.keys()][0]).toMatch(/^Video\/.+\/posts\/\d+-\w+\.mp4$/);
    const mine = await getUserVideos(login.user!.id);
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ title: 'Hoàng hôn', caption: 'đẹp', visibility: 'PUBLIC' });
    expect(mine[0].videoUrl).toMatch(/^https:\/\/storage\.test\/Video\//);
  });
});
