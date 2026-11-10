import { supabase } from '../utils/supabase';

export interface CommentItem {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  likesCount: number;
  createdAt: string;
  parentId?: string | null;
  isLiked?: boolean;
}

/**
 * Lấy danh sách bình luận của một video (Bottom sheet S04)
 */
export async function getCommentsByVideoId(videoId: string, currentUserId?: string): Promise<CommentItem[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profiles:user_id (id, display_name, avatar_url)
    `)
    .eq('video_id', videoId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  // Lấy danh sách commentIds user hiện tại đã like
  let likedCommentIds = new Set<string>();
  if (currentUserId && data && data.length > 0) {
    const commentIds = data.map((c: any) => c.id);
    const { data: likes } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', currentUserId)
      .in('comment_id', commentIds);

    if (likes) {
      likedCommentIds = new Set(likes.map((l: any) => l.comment_id));
    }
  }

  return (data || []).map((c: any) => ({
    id: c.id,
    videoId: c.video_id,
    userId: c.user_id,
    userName: (c.users || c.profiles)?.display_name || 'Anonymous',
    userAvatar: (c.users || c.profiles)?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    content: c.content,
    likesCount: c.likes_count,
    createdAt: c.created_at,
    parentId: c.parent_id,
    isLiked: likedCommentIds.has(c.id),
  }));
}

/**
 * Thêm bình luận mới (UC19)
 */
export async function addComment(
  videoId: string,
  userId: string,
  content: string,
  parentId?: string
): Promise<CommentItem> {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error('Nội dung bình luận phải từ 1 đến 500 ký tự');
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      video_id: videoId,
      user_id: userId,
      content: trimmed,
      parent_id: parentId || null,
    })
    .select(`
      *,
      profiles:user_id (id, display_name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw error;
  }

  return {
    id: data.id,
    videoId: data.video_id,
    userId: data.user_id,
    userName: (data.users || data.profiles)?.display_name || 'Anonymous',
    userAvatar: (data.users || data.profiles)?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    content: data.content,
    likesCount: data.likes_count || 0,
    createdAt: data.created_at,
    parentId: data.parent_id,
    isLiked: false,
  };
}

/**
 * Thích hoặc Bỏ thích một bình luận
 */
export async function toggleLikeComment(userId: string, commentId: string): Promise<boolean> {
  const { data } = await supabase
    .from('comment_likes')
    .select('*')
    .eq('user_id', userId)
    .eq('comment_id', commentId)
    .maybeSingle();

  if (data) {
    await supabase
      .from('comment_likes')
      .delete()
      .eq('user_id', userId)
      .eq('comment_id', commentId);
    return false;
  } else {
    await supabase
      .from('comment_likes')
      .insert({ user_id: userId, comment_id: commentId });
    return true;
  }
}

