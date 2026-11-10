import { supabase } from '../utils/supabase';

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  message: string;
  isRead: boolean;
  createdAt: string;
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
 * Lấy danh sách thông báo của người dùng (S22 - Thông báo)
 */
export async function getNotifications(recipientId: string): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      sender:sender_id (id, display_name, avatar_url),
      video:video_id (id, cover_url)
    `)
    .eq('recipient_id', recipientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return (data || []).map((n: any) => {
    let msg = '';
    switch (n.type) {
      case 'like':
        msg = 'liked your video';
        break;
      case 'comment':
        msg = 'commented on your video';
        break;
      case 'follow':
        msg = 'started following you';
        break;
      case 'mention':
        msg = 'mentioned you';
        break;
      default:
        msg = 'sent you an update';
    }

    return {
      id: n.id,
      type: n.type,
      message: msg,
      isRead: n.is_read,
      createdAt: n.created_at,
      sender: {
        id: n.sender?.id || '',
        name: n.sender?.display_name || 'Someone',
        avatar: n.sender?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      },
      video: n.video
        ? {
            id: n.video.id,
            coverUrl: n.video.cover_url,
          }
        : undefined,
    };
  });
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

