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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { ProfileHeader } from '../../components/profile/ProfileHeader';
import { Avatar } from '../../components/common/Avatar';
import { StatsRow } from '../../components/profile/StatsRow';
import { CustomButton } from '../../components/buttons/CustomButton';
import { SuggestionCard } from '../../components/profile/SuggestionCard';
import {
  ProfileTabBar,
  TabItem,
} from '../../components/profile/ProfileTabBar';
import { VideoThumbnailGrid } from '../../components/profile/VideoThumbnailGrid';
import { useAuthStore } from '../../store/useAuthStore';
import {
  getProfileById,
  getUserVideos,
  getLikedVideos,
  toggleFollowUser,
  searchProfiles,
  VideoDetailItem,
  UserProfileItem,
} from '../../services';
import { Ionicons } from '@expo/vector-icons';

const TABS: [TabItem, TabItem] = [
  { key: 'videos', label: 'Videos', iconName: 'play-outline' },
  { key: 'liked', label: 'Liked', iconName: 'heart-outline' },
];

export const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user: authUser, checkAuth } = useAuthStore();
  const userId = route.params?.userId;

  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos');
  const [profile, setProfile] = useState<UserProfileItem | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [videos, setVideos] = useState<VideoDetailItem[]>([]);
  const [likedVideos, setLikedVideos] = useState<VideoDetailItem[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfileItem[]>([]);
  const [dismissedUserIds, setDismissedUserIds] = useState<Set<string>>(new Set());
  const [followedSuggestionIds, setFollowedSuggestionIds] = useState<Set<string>>(new Set());

  const fetchUserData = useCallback(async (isRefresh = false) => {
    if (!userId) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch lại toàn bộ dữ liệu từ database
      const [
        userProfile,
        userVids,
        userLikes,
        suggestions,
      ] = await Promise.all([
        getProfileById(userId, authUser?.id),
        getUserVideos(userId),
        getLikedVideos(userId),
        searchProfiles('', authUser?.id),
      ]);

      if (userProfile) {
        setProfile(userProfile);
        setIsFollowing(!!userProfile.isFollowing);
      }

      setVideos(userVids);
      setLikedVideos(userLikes);

      setSuggestedUsers(
        suggestions.filter(
          (s) => s.id !== userId && s.id !== authUser?.id
        )
      );

    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, authUser?.id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    fetchUserData(true);
  }, [fetchUserData]);

  const handleToggleFollow = () => {
    checkAuth(async () => {
      if (!authUser?.id || !userId) return;
      try {
        const nextState = await toggleFollowUser(authUser.id, userId);
        setIsFollowing(nextState);
        if (profile) {
          setProfile({
            ...profile,
            followers: nextState ? profile.followers + 1 : Math.max(0, profile.followers - 1),
          });
        }
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
      if (!authUser?.id) return;
      try {
        const nextState = await toggleFollowUser(authUser.id, id);
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
    return suggestedUsers.filter((u) => !dismissedUserIds.has(u.id));
  }, [suggestedUsers, dismissedUserIds]);

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

  const displayName = profile?.name || 'User';
  const avatarUrl = profile?.avatar || 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Image/avt%20df.png';
  const bio = profile?.bio || '';
  const followingCount = profile?.following ?? 0;
  const followersCount = profile?.followers ?? 0;
  const likesCount = profile?.likes ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ProfileHeader type="B" onBack={() => navigation.goBack()} />

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
                    user={{
                      id: suggestion.id,
                      name: suggestion.name,
                      avatar: suggestion.avatar,
                      following: suggestion.following,
                      followers: suggestion.followers,
                      likes: suggestion.likes,
                      videos: '',
                    }}
                    index={idx}
                    isFollowing={followedSuggestionIds.has(suggestion.id)}
                    onToggleFollow={() => handleToggleFollowSuggestion(suggestion.id)}
                    onDismiss={() => handleDismissSuggestion(suggestion.id)}
                    onPressCard={() => navigation.push('UserProfile', { userId: suggestion.id })}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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

