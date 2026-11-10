import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { colors } from '../../../constants/colors';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { Avatar } from '../../../components/common/Avatar';
import { StatsRow } from '../../../components/profile/StatsRow';
import {
  ProfileTabBar,
  TabItem,
} from '../../../components/profile/ProfileTabBar';
import { VideoThumbnailGrid } from '../../../components/profile/VideoThumbnailGrid';
import { useDraftsStore } from '../../../store/useDraftsStore';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  getProfileById,
  getUserVideos,
  getLikedVideos,
  getFollowCounts,
  VideoDetailItem,
} from '../../../services';
import { Ionicons } from '@expo/vector-icons';

interface MyProfileViewProps {
  onOpenFollowList: (tab: 'followers' | 'following') => void;
  onSelectUser?: (userId: string) => void;
}

const TABS: TabItem[] = [
  { key: 'my-videos', label: 'My Videos', iconName: 'play-outline' },
  { key: 'liked', label: 'Liked', iconName: 'heart-outline' },
];

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  onOpenFollowList,
}) => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user: authUser, updateProfile: updateStoreProfile } = useAuthStore();
  const { publishedVideos } = useDraftsStore();

  const [activeTab, setActiveTab] = useState<'my-videos' | 'liked'>('my-videos');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const lastStatsRefreshAt = useRef(0);
  const statsRefreshInFlight = useRef(false);

  // Dữ liệu từ Supabase
  const [myVideos, setMyVideos] = useState<VideoDetailItem[]>([]);
  const [likedVideos, setLikedVideos] = useState<VideoDetailItem[]>([]);

  const fetchProfileAndVideos = useCallback(async () => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    try {
      const profileKey = authUser.auth_id || authUser.id;
      const [profileData, userVids, userLikedVids, followCounts] = await Promise.all([
        getProfileById(authUser.id),
        getUserVideos(authUser.id),
        getLikedVideos(authUser.id),
        getFollowCounts(profileKey),
      ]);

      if (profileData || followCounts) {
        const stats = {
          following: followCounts?.following ?? profileData?.following ?? 0,
          followers: followCounts?.followers ?? profileData?.followers ?? 0,
          likes: profileData?.likes ?? 0,
        };

        setProfileStats(stats);

        updateStoreProfile({
          ...(profileData
            ? {
                name: profileData.name,
                avatar: profileData.avatar,
                bio: profileData.bio,
              }
            : {}),
          ...stats,
        });
      }

      setMyVideos(userVids);
      setLikedVideos(userLikedVids);
    } catch (err) {
      console.error('Error fetching my profile data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authUser?.id, authUser?.auth_id, updateStoreProfile]);

  const refreshProfileStats = useCallback(async () => {
    if (!authUser?.id || statsRefreshInFlight.current) return;

    statsRefreshInFlight.current = true;
    try {
      const profileKey = authUser.auth_id || authUser.id;
      const [profileData, followCounts] = await Promise.all([
        getProfileById(authUser.id),
        getFollowCounts(profileKey),
      ]);

      if (!profileData && !followCounts) return;

      const stats = {
        following: followCounts?.following ?? profileData?.following ?? 0,
        followers: followCounts?.followers ?? profileData?.followers ?? 0,
        likes: profileData?.likes ?? 0,
      };

      setProfileStats(stats);
      updateStoreProfile({
        ...(profileData
          ? {
              name: profileData.name,
              avatar: profileData.avatar,
              bio: profileData.bio,
            }
          : {}),
        ...stats,
      });
    } catch (err) {
      console.error('Error refreshing profile stats:', err);
    } finally {
      statsRefreshInFlight.current = false;
    }
  }, [authUser?.id, authUser?.auth_id, updateStoreProfile]);

  const handleProfileScroll = useCallback(
    (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const now = Date.now();
      if (now - lastStatsRefreshAt.current < 1500) return;
      lastStatsRefreshAt.current = now;
      refreshProfileStats();
    },
    [refreshProfileStats]
  );

  // Load profile when focused or authUser changes
  useEffect(() => {
    if (isFocused) {
      fetchProfileAndVideos();
    }
  }, [isFocused, fetchProfileAndVideos]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfileAndVideos();
  };

  // Ghép video vừa publish từ store drafts (nếu có) vào video của user
  const displayedMyVideos = useMemo(() => {
    const publishedDraftItems = publishedVideos.map((pv) => ({
      id: pv.id,
      thumbnail: pv.thumbnail,
      views: pv.views || '0 views',
    }));

    const remoteItems = myVideos.map((v) => ({
      id: v.id,
      thumbnail: v.coverUrl,
      views: v.views,
    }));

    return [...publishedDraftItems, ...remoteItems];
  }, [publishedVideos, myVideos]);

  const displayedLikedVideos = useMemo(() => {
    return likedVideos.map((v) => ({
      id: v.id,
      thumbnail: v.coverUrl,
      views: v.views,
    }));
  }, [likedVideos]);

  const handleVideoPress = (video: { id: string }) => {
    navigation.navigate('ReelDetail', { videoId: video.id });
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const currentList = activeTab === 'my-videos' ? displayedMyVideos : displayedLikedVideos;
  const [profileStats, setProfileStats] = useState({
    following: authUser?.following ?? 0,
    followers: authUser?.followers ?? 0,
    likes: authUser?.likes ?? 0,
  });
  return (
    <View style={styles.screen}>
      <ProfileHeader
        type="A"
        onEditProfile={handleEditProfile}
        onOptions={handleOpenSettings}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={400}
          onScroll={handleProfileScroll}
          onScrollEndDrag={refreshProfileStats}
          onMomentumScrollEnd={refreshProfileStats}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={authUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'}
              size={80}
              ringColor={colors.primary}
              ringWidth={2}
              ringGap={3}
            />
          </View>

          {/* Name & Bio */}
          <Text style={styles.name}>{authUser?.name || 'Tài khoản'}</Text>
          {authUser?.bio ? <Text style={styles.bio}>{authUser.bio}</Text> : null}

          {/* Stats: Following, Followers, Likes */}
          <StatsRow
            following={profileStats.following}
            followers={profileStats.followers}
            likes={profileStats.likes}
            onPressFollowing={() => onOpenFollowList('following')}
            onPressFollowers={() => onOpenFollowList('followers')}
          />

          {/* Tab Bar: My Videos | Liked */}
          <ProfileTabBar
            tabs={TABS}
            activeTab={activeTab}
            onSelectTab={(key) => setActiveTab(key as 'my-videos' | 'liked')}
          />

          {/* Video Grid */}
          {currentList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'my-videos' ? 'videocam-outline' : 'heart-outline'}
                size={48}
                color="#CCCCCC"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'my-videos'
                  ? 'Bạn chưa đăng tải video nào.'
                  : 'Bạn chưa thích video nào.'}
              </Text>
              {activeTab === 'my-videos' && (
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={() => navigation.navigate('Camera')}
                >
                  <Text style={styles.createBtnText}>Tạo video mới</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <VideoThumbnailGrid
              videos={currentList}
              showHeartIcon={activeTab === 'liked'}
              onVideoPress={(item) => handleVideoPress(item)}
            />
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  createBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
