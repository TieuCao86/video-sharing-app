import { supabase } from '../utils/supabase';
import { decode } from 'base64-arraybuffer';
import { createFollowNotification } from './notificationService';

export interface UserProfileItem {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  following: number;
  followers: number;
  likes: number;
  videosCount: number;
  isFollowing?: boolean;
}
const dbIdCache = new Map<string, string>();

/** Kiểm tra chuỗi có đúng định dạng UUID v4 không */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(val?: string | null): val is string {
  return !!val && UUID_REGEX.test(val);
}

/** Đổi uid Supabase Auth -> users.id (khóa của bảng users) */
export async function resolveDbUserId(authId?: string | null): Promise<string | undefined> {
  if (!authId) return undefined;
  // Nếu không phải UUID hợp lệ → không cần query DB, tránh lỗi "invalid input syntax for type uuid"
  if (!isUUID(authId)) return undefined;

  const cached = dbIdCache.get(authId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle();

  if (error) console.error('[resolveDbUserId]', error);
  if (!data) return undefined;

  dbIdCache.set(authId, data.id);
  return data.id;
}

/**
 * Lấy hồ sơ tài khoản theo userId (kèm kiểm tra xem người dùng hiện tại có đang follow hay không)
 * @param userId        - users.id (db id, UUID) của user cần xem
 * @param currentAuthId - auth_id (Supabase Auth UID, UUID) của người đang đăng nhập
 */
export async function getProfileById(userId: string, currentAuthId?: string): Promise<UserProfileItem | null> {
  // Guard: userId phải là UUID hợp lệ
  if (!isUUID(userId)) return null;

  // Resolve auth_id → users.id (chỉ khi currentAuthId là UUID hợp lệ)
  const currentUserId = isUUID(currentAuthId)
    ? await resolveDbUserId(currentAuthId)
    : undefined;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  if (!data) {
    // Không tìm thấy user trong DB (VD: guest hoặc mock id cũ) -> return null im lặng, không log lỗi đỏ
    return null;
  }

  let isFollowing = false;
  if (currentUserId && currentUserId !== userId) {
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', currentUserId)
      .eq('following_id', userId);
    isFollowing = !!count && count > 0;
  }

  return {
    id: data.id,
    name: data.display_name,
    avatar: data.avatar_url || 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Image/avt%20df.png',
    bio: data.bio || '',
    following: data.following_count || 0,
    followers: data.followers_count || 0,
    likes: data.likes_count || 0,
    videosCount: data.videos_count || 0,
    isFollowing,
  };
}

/**
 * Tìm kiếm tài khoản theo Tên hiển thị (Tab Accounts màn hình S02)
 */
export async function searchProfiles(query: string, currentAuthId?: string): Promise<UserProfileItem[]> {
  // Chỉ resolve khi currentAuthId là UUID hợp lệ
  const currentUserId = isUUID(currentAuthId) ? await resolveDbUserId(currentAuthId) : undefined;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('display_name', `%${query}%`)
    .order('followers_count', { ascending: false });

  if (error) {
    console.error('Error searching profiles:', error);
    throw error;
  }

  let followedSet = new Set<string>();
  if (currentUserId) {
    const { data: followRows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId);
    if (followRows) {
      followedSet = new Set(followRows.map((f: any) => f.following_id));
    }
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.display_name,
    avatar: p.avatar_url || 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Image/avt%20df.png',
    bio: p.bio || '',
    following: p.following_count || 0,
    followers: p.followers_count || 0,
    likes: p.likes_count || 0,
    videosCount: p.videos_count || 0,
    isFollowing: followedSet.has(p.id),
  }));
}

/**
 * Upload ảnh avatar lên Supabase Storage hoặc lưu dưới dạng Base64
 */

export async function uploadAvatar(
  userId: string,
  imageUri: string,
  base64Data?: string | null
): Promise<string> {
  const ext = (imageUri.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const filePath = `avatars/${userId}_${Date.now()}.${ext}`;

  const fileBody = base64Data
    ? decode(base64Data.replace(/^data:image\/\w+;base64,/, ''))
    : await (await fetch(imageUri)).arrayBuffer();

  const { error } = await supabase.storage
    .from('Image') // kiểm tra đúng tên bucket
    .upload(filePath, fileBody, { contentType, upsert: true });

  if (error) {
    console.error('[uploadAvatar] storage error:', error);
    throw error;
  }

  const { data } = supabase.storage.from('Image').getPublicUrl(filePath);
  return data.publicUrl;
}

/**
 * Cập nhật thông tin Profile (S15 - Chỉnh sửa hồ sơ)
 */
export async function updateProfile(
  userId: string,
  updates: { display_name?: string; bio?: string; avatar_url?: string }
): Promise<boolean> {
  const sanitize = (value: string) => value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C-\u001F\u007F]/g, '')
    .trim();
  const safeUpdates = {
    ...updates,
    ...(updates.bio !== undefined ? { bio: sanitize(updates.bio) } : {}),
    ...(updates.display_name !== undefined ? { display_name: sanitize(updates.display_name) } : {}),
  };
  const { data, error, status } = await supabase
    .from('users')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('auth_id', userId)
    .select();

  console.log('[updateProfile]', { userId, status, rows: data?.length, error });

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  if (!data || data.length === 0) {
    throw new Error(
      'Không cập nhật được dòng nào: id không khớp hoặc RLS chặn UPDATE trên bảng users'
    );
  }
  return true;
}

/**
 * Đếm following / followers trực tiếp từ bảng follows.
 * Cột following_count / followers_count trên users không được cập nhật khi follow.
 */
export async function getFollowCounts(
  userId: string
): Promise<{ following: number; followers: number } | null> {
  if (!userId) return null;

  // Resolve auth_id → db id (chỉ khi là UUID hợp lệ)
  const dbId = isUUID(userId)
    ? (await resolveDbUserId(userId)) || userId
    : null;
  if (!dbId || !isUUID(dbId)) return null;

  const [followingRes, followersRes] = await Promise.all([
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', dbId),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', dbId),
  ]);

  if (followingRes.error || followersRes.error) {
    console.error(
      'Error counting follows:',
      followingRes.error || followersRes.error
    );
    return null;
  }

  return {
    following: followingRes.count ?? 0,
    followers: followersRes.count ?? 0,
  };
}

/**
 * Theo dõi hoặc Bỏ theo dõi tài khoản (UC20)
 */
export async function toggleFollowUser(authId: string, followingId: string): Promise<boolean> {
  const followerId = (await resolveDbUserId(authId)) || (isUUID(authId) ? authId : undefined);
  if (!followerId) throw new Error('Không tìm thấy hồ sơ người dùng hiện tại (users.auth_id chưa được gán).');
  if (followerId === followingId) throw new Error('Không thể tự theo dõi chính mình.');

  const { data: existing, error: checkError } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  if (checkError) throw checkError;

  if (existing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });
  if (error && error.code !== '23505') throw error; // 23505: đã follow (bấm đúp)

  // Tạo notification cho người được follow (fire-and-forget, không block luồng chính)
  createFollowNotification(followerId, followingId).catch(() => { });

  return true;
}

/**
 * Lấy danh sách những người theo dõi mình hoặc mình theo dõi
 */
export async function getFollowList(
  userId: string,
  type: 'followers' | 'following',
  currentUserId?: string,
  isAuthId = false
): Promise<UserProfileItem[]> {
  try {
    const dbId = (await resolveDbUserId(userId)) || userId;
    if (!dbId) return [];
    void isAuthId;
    const relatedColumn = type === 'followers' ? 'follower_id' : 'following_id';
    const ownerColumn = type === 'followers' ? 'following_id' : 'follower_id';

    const { data: followRows, error } = await supabase
      .from('follows')
      .select(relatedColumn)
      .eq(ownerColumn, dbId);

    if (error) throw error;

    const relatedIds = Array.from(
      new Set(
        (followRows || [])
          .map((row: Record<string, string>) => row[relatedColumn])
          .filter(Boolean)
      )
    );
    if (relatedIds.length === 0) return [];

    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .in('id', relatedIds);

    if (profileError) throw profileError;

    let followedSet = new Set<string>();
    const viewerId = currentUserId
      ? (await resolveDbUserId(currentUserId)) || currentUserId
      : undefined;
    if (viewerId) {
      const { data: viewerFollows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', viewerId)
        .in('following_id', relatedIds);
      followedSet = new Set((viewerFollows || []).map((row) => row.following_id));
    }

    return (profiles || []).map((p: any) => ({
      id: p.id,
      name: p.display_name,
      avatar:
        p.avatar_url ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      bio: p.bio || '',
      following: p.following_count || 0,
      followers: p.followers_count || 0,
      likes: p.likes_count || 0,
      videosCount: p.videos_count || 0,
      isFollowing: followedSet.has(p.id),
    }));
  } catch (err) {
    console.error('Error fetching follow list:', err);
    return [];
  }
}
