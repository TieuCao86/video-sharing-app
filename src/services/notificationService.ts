import { supabase } from '../utils/supabase';

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'comment_like' | 'follow' | 'mention';
  message: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
  };
  video?: {
    id: string;
    coverUrl?: string;
  };
}

/**
 * Tính thời gian hiển thị tương đối (vd: 2 phút trước, 1 giờ trước)
 */
function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  } catch {
    return 'Gần đây';
  }
}

/**
 * Lấy danh sách thông báo của người dùng (S22 - Thông báo)
 */
export async function getNotifications(recipientId: string): Promise<NotificationItem[]> {
  try {
    // 1. Lấy danh sách notifications kèm thông tin video
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('*, video:video_id (id, cover_url)')
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    if (!notifs || notifs.length === 0) {
      return [];
    }

    // 2. Lấy thông tin sender từ bảng users một cách độc lập (an toàn tuyệt đối, không lo thiếu FK)
    const senderIds = [...new Set(notifs.map((n: any) => n.sender_id).filter(Boolean))];
    const senderMap = new Map<string, { id: string; display_name: string; avatar_url: string }>();

    if (senderIds.length > 0) {
      const { data: senders } = await supabase
        .from('users')
        .select('id, display_name, avatar_url')
        .in('id', senderIds);

      (senders || []).forEach((s: any) => {
        senderMap.set(s.id, s);
      });
    }

    // 3. Chuẩn hóa dữ liệu trả về cho giao diện
    return notifs.map((n: any) => {
      let msg = '';
      switch (n.type) {
        case 'like':
          msg = 'đã thích video của bạn';
          break;
        case 'comment_like':
          msg = 'đã thích bình luận của bạn';
          break;
        case 'comment':
          msg = 'đã bình luận về video của bạn';
          break;
        case 'follow':
          msg = 'đã bắt đầu theo dõi bạn';
          break;
        case 'mention':
          msg = 'đã nhắc đến bạn trong bình luận';
          break;
        default:
          msg = 'đã gửi tương tác mới';
      }

      const senderInfo = senderMap.get(n.sender_id);

      return {
        id: n.id,
        type: n.type,
        message: msg,
        isRead: n.is_read,
        createdAt: n.created_at,
        timeAgo: formatTimeAgo(n.created_at),
        sender: {
          id: senderInfo?.id || n.sender_id || '',
          name: senderInfo?.display_name || 'Người dùng',
          avatar:
            senderInfo?.avatar_url ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        },
        video: n.video
          ? {
            id: n.video.id,
            coverUrl: n.video.cover_url,
          }
          : undefined,
      };
    });
  } catch (err) {
    console.error('getNotifications exception:', err);
    throw err;
  }
}

/**
 * Đánh dấu một thông báo là đã đọc
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
}

/**
 * Đánh dấu tất cả thông báo của người dùng là đã đọc
 */
export async function markAllNotificationsAsRead(recipientId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('recipient_id', recipientId);
}

/**
 * Tạo thông báo khi người dùng bình luận video của người khác
 * @param senderId    - users.id của người bình luận
 * @param recipientId - users.id của chủ video
 * @param videoId     - id video được bình luận
 */
export async function createCommentNotification(
  senderId: string,
  recipientId: string,
  videoId: string
): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      type: 'comment',
      sender_id: senderId,
      recipient_id: recipientId,
      video_id: videoId,
      is_read: false,
    });

    if (error) {
      console.error('[createCommentNotification] insert error:', error);
    }
  } catch (err) {
    console.error('[createCommentNotification] exception:', err);
  }
}

/**
 * Báo cho chủ bình luận khi có người thích bình luận của họ.
 * Không gửi nếu người thích chính là chủ bình luận.
 */
export async function createCommentLikeNotification(
  senderId: string,
  recipientId: string,
  videoId: string
): Promise<void> {
  if (!senderId || !recipientId || senderId === recipientId) return;

  try {
    const { error } = await supabase.from('notifications').insert({
      type: 'comment_like',
      sender_id: senderId,
      recipient_id: recipientId,
      video_id: videoId,
      is_read: false,
    });

    if (error) {
      console.error('[createCommentLikeNotification] insert error:', error);
    }
  } catch (err) {
    console.error('[createCommentLikeNotification] exception:', err);
  }
}

export async function createLikeNotification(
  senderId: string,
  recipientId: string,
  videoId: string
): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      type: 'like',
      sender_id: senderId,
      recipient_id: recipientId,
      video_id: videoId,
      is_read: false,
    });

    if (error) {
      console.error('[createLikeNotification] insert error:', error);
    }
  } catch (err) {
    console.error('[createLikeNotification] exception:', err);
  }
}
/**
 * Tạo thông báo follow khi người dùng A bắt đầu theo dõi người dùng B
 * @param senderId   - users.id (db id) của người thực hiện follow
 * @param recipientId - users.id (db id) của người được follow
 */
export async function createFollowNotification(
  senderId: string,
  recipientId: string
): Promise<void> {
  try {
    // Tránh tạo thông báo trùng lặp nếu đã tồn tại một follow-notification chưa đọc
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('type', 'follow')
      .eq('sender_id', senderId)
      .eq('recipient_id', recipientId)
      .maybeSingle();

    if (existing) return; // đã có, bỏ qua

    const { error } = await supabase.from('notifications').insert({
      type: 'follow',
      sender_id: senderId,
      recipient_id: recipientId,
      is_read: false,
    });

    if (error) {
      console.error('[createFollowNotification] insert error:', error);
    }
  } catch (err) {
    // Không để lỗi notification làm hỏng luồng follow chính
    console.error('[createFollowNotification] exception:', err);
  }
}
