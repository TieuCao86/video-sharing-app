import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../constants/colors';
import { ApiUser } from '../../../types/user.type';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { Avatar } from '../../../components/common/Avatar';
import { StatsRow } from '../../../components/profile/StatsRow';
import { CustomButton } from '../../../components/buttons/CustomButton';
import { SuggestionCard } from '../../../components/profile/SuggestionCard';
import {
  ProfileTabBar,
  TabItem,
} from '../../../components/profile/ProfileTabBar';
import { VideoThumbnailGrid } from '../../../components/profile/VideoThumbnailGrid';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  getProfileById,
  getUserVideos,
  getLikedVideos,
  toggleFollowUser,
  VideoDetailItem,
  UserProfileItem,
} from '../../../services';
import { Ionicons } from '@expo/vector-icons';

interface UserProfileViewProps {
  user: ApiUser;
  currentUserId: string;
  allUsers: ApiUser[];
  onBack: () => void;
  onSelectUser: (userId: string) => void;
  isFollowing?: boolean;
  onToggleFollowProfile?: () => void;
}

const TABS: [TabItem, TabItem] = [
  { key: 'videos', label: 'Videos', iconName: 'play-outline' },
  { key: 'liked', label: 'Liked', iconName: 'heart-outline' },
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  user: initialUser,
  currentUserId,
  allUsers,
  onBack,
  onSelectUser,
  isFollowing: initialIsFollowing = false,
  onToggleFollowProfile,
}) => {
  const navigation = useNavigation<any>();
  const { user: authUser, checkAuth } = useAuthStore();
  // Ưu tiên auth_id từ store để truyền cho toggleFollowUser / getProfileById
  const currentAuthId = authUser?.auth_id || undefined;
  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos');
  const [profile, setProfile] = useState<UserProfileItem | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(initialIsFollowing);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [videos, setVideos] = useState<VideoDetailItem[]>([]);
  const [likedVideos, setLikedVideos] = useState<VideoDetailItem[]>([]);
  const [dismissedUserIds, setDismissedUserIds] = useState<Set<string>>(new Set());
  const [followedSuggestionIds, setFollowedSuggestionIds] = useState<Set<string>>(new Set());

  const fetchUserData = useCallback(async () => {
    try {
      const [userProfile, userVids, userLikes] = await Promise.all([
        getProfileById(initialUser.id, currentAuthId),
        getUserVideos(initialUser.id),
        getLikedVideos(initialUser.id),
      ]);

      if (userProfile) {
        setProfile(userProfile);
        setIsFollowing(!!userProfile.isFollowing);
      }
      setVideos(userVids);
      setLikedVideos(userLikes);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialUser.id, currentAuthId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handleToggleFollow = () => {
    checkAuth(async () => {
      try {
        const nextState = await toggleFollowUser(currentAuthId!, initialUser.id);
        setIsFollowing(nextState);
        if (profile) {
          setProfile({
            ...profile,
            followers: nextState ? profile.followers + 1 : Math.max(0, profile.followers - 1),
          });
        }
        if (onToggleFollowProfile) onToggleFollowProfile();
      } catch (err) {
        console.error('Error toggling follow:', err);
      }
    });
  };

  const handleDismissSuggestion = (id: string) => {
    setDismissedUserIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  };

  const handleToggleFollowSuggestion = (id: string) => {
    checkAuth(async () => {
      try {
        const nextState = await toggleFollowUser(currentAuthId!, id);
        setFollowedSuggestionIds((prev) => {
          const updated = new Set(prev);
          if (nextState) updated.add(id);
          else updated.delete(id);
          return updated;
        });
      } catch (err) {
        console.error('Error following suggestion:', err);
      }
    });
  };

  const suggestions = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.id !== initialUser.id &&
        u.id !== currentUserId &&
        !dismissedUserIds.has(u.id)
    );
  }, [allUsers, initialUser.id, currentUserId, dismissedUserIds]);

  const displayedVideos = useMemo(() => {
    const list = activeTab === 'videos' ? videos : likedVideos;
    return list.map((v) => ({
      id: v.id,
      thumbnail: v.coverUrl,
      views: v.views,
    }));
  }, [activeTab, videos, likedVideos]);

  const handleVideoPress = (item: { id: string }) => {
    navigation.navigate('ReelDetail', { videoId: item.id });
  };

  const displayName = profile?.name || initialUser.name;
  const avatarUrl = profile?.avatar || initialUser.avatar;
  const bio = profile?.bio || initialUser.bio || '';
  const followingCount = profile?.following ?? initialUser.following;
  const followersCount = profile?.followers ?? initialUser.followers;
  const likesCount = profile?.likes ?? initialUser.likes;

  return (
    <View style={styles.screen}>
      <ProfileHeader type="B" onBack={onBack} />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <Avatar
              uri={avatarUrl}
              size={80}
              ringColor={colors.secondary}
              ringWidth={2}
              ringGap={3}
            />
          </View>

          <Text style={styles.name}>{displayName}</Text>
          {bio ? <Text style={styles.bio}>{bio}</Text> : null}

          <StatsRow following={followingCount} followers={followersCount} likes={likesCount} />

          {/* Follow button */}
          <CustomButton
            title={isFollowing ? 'Following' : 'Follow'}
            variant={isFollowing ? 'muted-outline' : 'primary'}
            onPress={handleToggleFollow}
            style={styles.mainFollowButton}
            textStyle={styles.mainFollowText}
          />

          {/* Suggested accounts */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Suggested accounts</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('SearchTab')}>
                  <Text style={styles.viewMore}>View more</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsList}
              >
                {suggestions.map((suggestion, idx) => (
                  <SuggestionCard
                    key={suggestion.id}
                    user={suggestion}
                    index={idx}
                    isFollowing={followedSuggestionIds.has(suggestion.id)}
                    onToggleFollow={() => handleToggleFollowSuggestion(suggestion.id)}
                    onDismiss={() => handleDismissSuggestion(suggestion.id)}
                    onPressCard={() => onSelectUser(suggestion.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Tabs: Videos | Liked */}
          <ProfileTabBar
            tabs={TABS}
            activeTab={activeTab}
            onSelectTab={(key) => setActiveTab(key as 'videos' | 'liked')}
          />

          {/* Video Grid */}
          {displayedVideos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === 'videos' ? 'videocam-outline' : 'heart-outline'}
                size={48}
                color="#CCCCCC"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'videos'
                  ? 'Người dùng chưa đăng video nào.'
                  : 'Chưa có video được thích.'}
              </Text>
            </View>
          ) : (
            <VideoThumbnailGrid
              videos={displayedVideos}
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
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  mainFollowButton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 40,
    borderRadius: 8,
  },
  mainFollowText: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  viewMore: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  suggestionsList: {
    paddingHorizontal: 16,
    paddingRight: 4,
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
});
