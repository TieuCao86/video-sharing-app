import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import {
  NotificationItem,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';
import { LoginRequiredModal } from '../../components/auth/LoginRequiredModal';

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isLoggedIn, showLoginModal } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchNotifs = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      fetchNotifs();
    } else {
      setIsLoading(false);
    }
  }, [isLoggedIn, user?.id, fetchNotifs]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchNotifs();
  }, [fetchNotifs]);

  const filteredNotifications = activeTab === 'Unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationPress = async (item: NotificationItem) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      try {
        await markNotificationAsRead(item.id);
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    }

    // Điều hướng tới video nếu có
    if (item.video?.id) {
      navigation.navigate('ReelDetail', { videoId: item.video.id });
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsAsRead(user.id);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const renderBadgeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return (
          <View style={[styles.typeBadge, { backgroundColor: '#FF2442' }]}>
            <Ionicons name="heart" size={10} color="#FFFFFF" />
          </View>
        );
      case 'comment':
        return (
          <View style={[styles.typeBadge, { backgroundColor: '#007AFF' }]}>
            <Ionicons name="chatbubble" size={9} color="#FFFFFF" />
          </View>
        );
      case 'follow':
        return (
          <View style={[styles.typeBadge, { backgroundColor: '#34C759' }]}>
            <Ionicons name="person-add" size={10} color="#FFFFFF" />
          </View>
        );
      default:
        return (
          <View style={[styles.typeBadge, { backgroundColor: '#5856D6' }]}>
            <Ionicons name="notifications" size={10} color="#FFFFFF" />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {isLoggedIn && unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllRead}>Đánh dấu đã đọc</Text>
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
            Tất cả
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'Unread' && styles.tabActive]}
          onPress={() => setActiveTab('Unread')}
        >
          <Text style={[styles.tabText, activeTab === 'Unread' && styles.tabTextActive]}>
            Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF2442" />
        </View>
      ) : !isLoggedIn ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={54} color="#C7C7CC" />
          <Text style={styles.emptyTitle}>Chưa đăng nhập</Text>
          <Text style={styles.emptySubtitle}>
            Vui lòng đăng nhập để xem thông báo tương tác của bạn.
          </Text>
          <TouchableOpacity
            style={styles.loginPromptButton}
            onPress={showLoginModal}
          >
            <Text style={styles.loginPromptText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#FF2442"
              colors={['#FF2442']}
            />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-unread-outline" size={54} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>Không có thông báo nào</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'Unread'
                  ? 'Bạn đã đọc tất cả thông báo!'
                  : 'Khi có người thích, bình luận hoặc theo dõi, thông báo sẽ hiển thị ở đây.'}
              </Text>
            </View>
          ) : (
            filteredNotifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.notificationItem,
                  !item.isRead && styles.notificationUnread,
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
              >
                {/* Avatar with badge */}
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: item.sender.avatar }}
                    style={styles.avatar}
                  />
                  {renderBadgeIcon(item.type)}
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                  <Text style={styles.messageText}>
                    <Text style={styles.userName}>{item.sender.name}</Text>
                    {' '}
                    {item.message}
                  </Text>
                  <Text style={styles.timeText}>{item.timeAgo}</Text>
                </View>

                {/* Video Cover Thumbnail or Unread indicator */}
                {item.video?.coverUrl ? (
                  <Image
                    source={{ uri: item.video.coverUrl }}
                    style={styles.thumbnail}
                  />
                ) : (
                  !item.isRead && <View style={styles.unreadDot} />
                )}
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}

      <LoginRequiredModal />
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
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  markAllRead: {
    fontSize: 13,
    fontWeight: '600',
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
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#FF2442',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // List
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E5EA',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    fontWeight: '700',
    color: '#000000',
  },
  timeText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginLeft: 8,
    backgroundColor: '#E5E5EA',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2442',
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginPromptButton: {
    marginTop: 20,
    backgroundColor: '#FF2442',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginPromptText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
