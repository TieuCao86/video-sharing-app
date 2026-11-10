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
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching profile:', error);
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
    avatar: data.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    bio: data.bio || '',
    following: data.following_count,
    followers: data.followers_count,
    likes: data.likes_count,
    videosCount: data.videos_count,
    isFollowing,
  };
}

/**
 * Tìm kiếm tài khoản theo Tên hiển thị (Tab Accounts màn hình S02)
 */
export async function searchProfiles(query: string, currentUserId?: string): Promise<UserProfileItem[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('display_name', `%${query}%`)
    .order('followers_count', { ascending: false });

  if (error) {
    console.error('Error searching profiles:', error);
    throw error;
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.display_name,
    avatar: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    bio: p.bio || '',
    following: p.following_count,
    followers: p.followers_count,
    likes: p.likes_count,
    videosCount: p.videos_count,
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
    .from('profiles')
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

