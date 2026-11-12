import { supabase } from "../utils/supabase";
import { resolveDbUserId } from "./userService";
import {
  createCommentLikeNotification,
  createCommentNotification,
} from "./notificationService";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";

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

function mapComment(
  c: any,
  profile?: { display_name?: string; avatar_url?: string } | null,
  isLiked = false,
): CommentItem {
  return {
    id: c.id,
    videoId: c.video_id,
    userId: c.user_id,
    userName: profile?.display_name || "Anonymous",
    userAvatar: profile?.avatar_url || DEFAULT_AVATAR,
    content: c.content,
    likesCount: c.likes_count || 0,
    createdAt: c.created_at,
    parentId: c.parent_id,
    isLiked,
  };
}

async function fetchProfilesByIds(userIds: string[]) {
  const profileMap = new Map<
    string,
    { display_name?: string; avatar_url?: string }
  >();
  if (userIds.length === 0) return profileMap;

  const { data: profiles } = await supabase
    .from("users")
    .select("id, display_name, avatar_url")
    .in("id", userIds);

  (profiles || []).forEach((p: any) => {
    profileMap.set(p.id, p);
  });
  return profileMap;
}

/**
 * Lấy danh sách bình luận của một video (Bottom sheet S04)
 */
export async function getCommentsByVideoId(
  videoId: string,
  currentUserId?: string,
): Promise<CommentItem[]> {
  // 1. Kiểm tra video có cho phép bình luận không
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("allow_comments")
    .eq("id", videoId)
    .maybeSingle();

  if (videoError) {
    throw videoError;
  }

  // Video không tồn tại hoặc đã tắt bình luận
  if (!video || video.allow_comments === false) {
    return [];
  }

  // 2. Lấy danh sách bình luận
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }

  const rows = data || [];

  // 3. Lấy thông tin người bình luận
  const userIds = [...new Set(rows.map((c: any) => c.user_id).filter(Boolean))];
  const profileMap = await fetchProfilesByIds(userIds);

  // 4. Lấy danh sách comment user hiện tại đã like
  let likedCommentIds = new Set<string>();

  const dbUserId = currentUserId
    ? ((await resolveDbUserId(currentUserId)) ?? currentUserId)
    : undefined;

  if (dbUserId && rows.length > 0) {
    const commentIds = rows.map((c: any) => c.id);

    const { data: likes, error: likesError } = await supabase
      .from("comment_likes")
      .select("comment_id")
      .eq("user_id", dbUserId)
      .in("comment_id", commentIds);

    if (likesError) {
      console.error("Error fetching comment likes:", likesError);
    } else if (likes) {
      likedCommentIds = new Set(likes.map((l: any) => l.comment_id));
    }
  }

  // 5. Chuyển dữ liệu thành CommentItem
  return rows.map((c: any) =>
    mapComment(c, profileMap.get(c.user_id), likedCommentIds.has(c.id)),
  );
}

/**
 * Thêm bình luận mới (UC19)
 */
export async function addComment(
  videoId: string,
  userId: string,
  content: string,
  parentId?: string,
): Promise<CommentItem> {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new Error("Nội dung bình luận phải từ 1 đến 500 ký tự");
  }

  const dbUserId = (await resolveDbUserId(userId)) ?? userId;

  const { data, error } = await supabase
    .from("comments")
    .insert({
      video_id: videoId,
      user_id: dbUserId,
      content: trimmed,
      parent_id: parentId || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Error adding comment:", error);
    if (error?.code === "42501") {
      throw new Error("Không thể gửi bình luận. Hãy đăng nhập lại.");
    }
    throw new Error(error?.message || "Không thể gửi bình luận");
  }

  const profileMap = await fetchProfilesByIds([dbUserId]);

  // Trigger cập nhật comments_count; service chỉ tạo thông báo cho chủ video.
  void (async () => {
    try {
      const { data: video } = await supabase
        .from("videos")
        .select("creator_id")
        .eq("id", videoId)
        .maybeSingle();

      if (!video) return;

      const creatorId = video.creator_id as string | null;
      if (!creatorId || creatorId === dbUserId) return;

      const creatorDbId = (await resolveDbUserId(creatorId)) ?? creatorId;
      if (creatorDbId && creatorDbId !== dbUserId) {
        await createCommentNotification(dbUserId, creatorDbId, videoId);
      }
    } catch (err) {
      console.error("Error updating comment side effects:", err);
    }
  })();

  return mapComment(data, profileMap.get(dbUserId), false);
}

export interface CommentLikeResult {
  liked: boolean;
  likesCount: number;
}

async function applyCommentLikeCount(
  commentId: string,
  delta: number,
): Promise<{
  likesCount: number;
  ownerId?: string;
  videoId?: string;
}> {
  const { data, error } = await supabase
    .from("comments")
    .select("likes_count, user_id, video_id")
    .eq("id", commentId)
    .maybeSingle();

  if (error || !data) {
    console.error("Error reading comment for like count:", error);
    throw new Error(error?.message || "Không thể cập nhật số lượt thích");
  }

  const likesCount = Math.max((data.likes_count || 0) + delta, 0);
  const { error: updateError } = await supabase
    .from("comments")
    .update({ likes_count: likesCount })
    .eq("id", commentId);

  if (updateError) {
    console.error("Error updating comment likes_count:", updateError);
    throw new Error(updateError.message || "Không thể cập nhật số lượt thích");
  }

  const ownerId = data.user_id
    ? ((await resolveDbUserId(data.user_id)) ?? data.user_id)
    : undefined;

  return {
    likesCount,
    ownerId,
    videoId: data.video_id,
  };
}

/**
 * Thích hoặc Bỏ thích một bình luận.
 * Cập nhật comments.likes_count và báo cho chủ bình luận khi có lượt thích mới.
 */
export async function toggleLikeComment(
  userId: string,
  commentId: string,
): Promise<CommentLikeResult> {
  const dbUserId = (await resolveDbUserId(userId)) ?? userId;

  const { data, error: readError } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("user_id", dbUserId)
    .eq("comment_id", commentId)
    .maybeSingle();

  if (readError) {
    console.error("Error reading comment like:", readError);
    throw new Error(readError.message || "Không thể cập nhật lượt thích");
  }

  if (data) {
    const { error } = await supabase
      .from("comment_likes")
      .delete()
      .eq("user_id", dbUserId)
      .eq("comment_id", commentId);

    if (error) {
      console.error("Error removing comment like:", error);
      throw new Error(error.message || "Không thể bỏ thích bình luận");
    }

    const updated = await applyCommentLikeCount(commentId, -1);
    return { liked: false, likesCount: updated.likesCount };
  }

  const { error } = await supabase
    .from("comment_likes")
    .insert({ user_id: dbUserId, comment_id: commentId });

  if (error && error.code !== "23505") {
    console.error("Error adding comment like:", error);
    if (error.code === "42501") {
      throw new Error("Không thể thích bình luận. Hãy đăng nhập lại.");
    }
    throw new Error(error.message || "Không thể thích bình luận");
  }

  const alreadyLiked = error?.code === "23505";
  const updated = await applyCommentLikeCount(commentId, alreadyLiked ? 0 : 1);

  if (!alreadyLiked && updated.ownerId && updated.videoId) {
    void createCommentLikeNotification(
      dbUserId,
      updated.ownerId,
      updated.videoId,
    );
  }

  return { liked: true, likesCount: updated.likesCount };
}
