import { supabase } from '../utils/supabase';

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

/**
 * Lấy hồ sơ tài khoản theo userId (kèm kiểm tra xem người dùng hiện tại có đang follow hay không)
 */
export async function getProfileById(userId: string, currentUserId?: string): Promise<UserProfileItem | null> {
  if (!userId) return null;

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
export async function searchProfiles(query: string, currentUserId?: string): Promise<UserProfileItem[]> {
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
 * Cập nhật thông tin Profile (S15 - Chỉnh sửa hồ sơ)
 */
export async function updateProfile(
  userId: string,
  updates: { display_name?: string; bio?: string; avatar_url?: string }
): Promise<boolean> {
  const { error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
  return true;
}

/**
 * Theo dõi hoặc Bỏ theo dõi tài khoản (UC20)
 */
export async function toggleFollowUser(followerId: string, followingId: string): Promise<boolean> {
  // Kiểm tra trạng thái hiện tại
  const { data } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  if (data) {
    // Đã follow -> Hủy follow
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
    return false; // Hiện tại là chưa follow
  } else {
    // Chưa follow -> Thêm follow
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
    return true; // Hiện tại là đang follow
  }
}

/**
 * Lấy danh sách những người theo dõi mình hoặc mình theo dõi
 */
export async function getFollowList(
  userId: string,
  type: 'followers' | 'following',
  currentUserId?: string
): Promise<UserProfileItem[]> {
  try {
    if (type === 'followers') {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          users:follower_id (*)
        `)
        .eq('following_id', userId);

      if (error) throw error;

      return (data || [])
        .filter((item: any) => item.users)
        .map((item: any) => ({
          id: item.users.id,
          name: item.users.display_name,
          avatar: item.users.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          bio: item.users.bio || '',
          following: item.users.following_count || 0,
          followers: item.users.followers_count || 0,
          likes: item.users.likes_count || 0,
          videosCount: item.users.videos_count || 0,
        }));
    } else {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          created_at,
          users:following_id (*)
        `)
        .eq('follower_id', userId);

      if (error) throw error;

      return (data || [])
        .filter((item: any) => item.users)
        .map((item: any) => ({
          id: item.users.id,
          name: item.users.display_name,
          avatar: item.users.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          bio: item.users.bio || '',
          following: item.users.following_count || 0,
          followers: item.users.followers_count || 0,
          likes: item.users.likes_count || 0,
          videosCount: item.users.videos_count || 0,
        }));
    }
  } catch (err) {
    console.error('Error fetching follow list:', err);
    return [];
  }
}

