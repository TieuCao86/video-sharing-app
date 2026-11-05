import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: {
    name: string;
    avatar: string;
  };
  message: string;
  time: string;
  isRead: boolean;
  thumbnail?: string; // For video-related notifications
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: {
      name: 'Laura',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
    message: 'liked your video',
    time: '2 min ago',
    isRead: false,
    thumbnail: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200',
  },
  {
    id: '2',
    type: 'comment',
    user: {
      name: 'William',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    },
    message: 'commented on your video: "Amazing content!"',
    time: '15 min ago',
    isRead: false,
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200',
  },
  {
    id: '3',
    type: 'follow',
    user: {
      name: 'Julia',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
    message: 'started following you',
    time: '1 hour ago',
    isRead: false,
  },
  {
    id: '4',
    type: 'like',
    user: {
      name: 'Peter',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
    },
    message: 'liked your video',
    time: '2 hours ago',
    isRead: true,
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200',
  },
  {
    id: '5',
    type: 'mention',
    user: {
      name: 'Adam',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
    message: 'mentioned you in a comment',
    time: '3 hours ago',
    isRead: true,
  },
  {
    id: '6',
    type: 'comment',
    user: {
      name: 'Liz',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    },
    message: 'commented: "Love this! 😍"',
    time: '5 hours ago',
    isRead: true,
    thumbnail: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200',
  },
  {
    id: '7',
    type: 'follow',
    user: {
      name: 'Cris',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100',
    },
    message: 'started following you',
    time: '1 day ago',
    isRead: true,
  },
];

export const NotificationScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState(mockNotifications);

  const filteredNotifications = activeTab === 'Unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'All' && styles.tabActive]}
          onPress={() => setActiveTab('All')}
        >
          <Text style={[styles.tabText, activeTab === 'All' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Unread' && styles.tabActive]}
          onPress={() => setActiveTab('Unread')}
        >
          <Text style={[styles.tabText, activeTab === 'Unread' && styles.tabTextActive]}>
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No notifications</Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.notificationUnread
              ]}
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              {/* Avatar */}
              <Image 
                source={{ uri: notification.user.avatar }} 
                style={styles.avatar}
              />

              {/* Content */}
              <View style={styles.contentContainer}>
                <Text style={styles.messageText}>
                  <Text style={styles.userName}>{notification.user.name}</Text>
                  {' '}
                  {notification.message}
                </Text>
                <Text style={styles.timeText}>{notification.time}</Text>
              </View>

              {/* Thumbnail or Unread Indicator */}
              {notification.thumbnail ? (
                <Image 
                  source={{ uri: notification.thumbnail }} 
                  style={styles.thumbnail}
                />
              ) : (
                !notification.isRead && <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  markAllRead: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF2442',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#FF2D55',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Notification Item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F5',
  },
  notificationUnread: {
    backgroundColor: '#FFF5F7',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 4,
  },
  userName: {
    fontWeight: '600',
    color: '#000000',
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999999',
  },
});
