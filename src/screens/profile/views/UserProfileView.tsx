import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
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
import {
  PLACEHOLDER_BIO,
  PLACEHOLDER_VIEW_COUNT,
} from '../../../constants/profile';

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
  user,
  currentUserId,
  allUsers,
  onBack,
  onSelectUser,
  isFollowing = false,
  onToggleFollowProfile,
}) => {
  // Spec: Liked tab is ACTIVE by default on View B
  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('liked');
  const [dismissedUserIds, setDismissedUserIds] = useState<Set<string>>(new Set());
  const [followedSuggestionIds, setFollowedSuggestionIds] = useState<Set<string>>(new Set());

  const handleDismissSuggestion = (id: string) => {
    setDismissedUserIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  };

  const handleToggleFollowSuggestion = (id: string) => {
    setFollowedSuggestionIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  const suggestions = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.id !== user.id &&
        u.id !== currentUserId &&
        !dismissedUserIds.has(u.id)
    );
  }, [allUsers, user.id, currentUserId, dismissedUserIds]);

  // Fill grid with owner's video first, then other users' videos
  const videoItems = useMemo(() => {
    const otherUsers = allUsers.filter((u) => u.id !== user.id);
    const combined = [
      { id: `owner-${user.id}`, thumbnail: user.videos, views: PLACEHOLDER_VIEW_COUNT },
      ...otherUsers.map((u) => ({
        id: `user-${u.id}`,
        thumbnail: u.videos,
        views: PLACEHOLDER_VIEW_COUNT,
      })),
    ];

    while (combined.length < 6) {
      combined.push({
        id: `fill-${combined.length}`,
        thumbnail: user.videos,
        views: PLACEHOLDER_VIEW_COUNT,
      });
    }

    return combined;
  }, [user, allUsers]);

  // Liked tab uses a different slice of the video list
  const displayedVideos = useMemo(() => {
    if (activeTab === 'liked') {
      const slice = videoItems.slice(2);
      return slice.length >= 6 ? slice : [...slice, ...videoItems.slice(0, 6 - slice.length)];
    }
    return videoItems;
  }, [activeTab, videoItems]);

  return (
    <View style={styles.screen}>
      <ProfileHeader type="B" onBack={onBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={user.avatar}
            size={80}
            ringColor={colors.secondary}
            ringWidth={2}
            ringGap={3}
          />
        </View>

        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.bio}>{PLACEHOLDER_BIO}</Text>

        <StatsRow following={user.following} followers={user.followers} />

        <CustomButton
          title={isFollowing ? 'Following' : 'Follow'}
          variant={isFollowing ? 'muted-outline' : 'primary'}
          onPress={onToggleFollowProfile || (() => {})}
          style={styles.mainFollowButton}
          textStyle={styles.mainFollowText}
        />

        {suggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Suggested accounts</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.viewMore}>View more</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsList}
            >
              {suggestions.map((item, index) => (
                <SuggestionCard
                  key={item.id}
                  user={item}
                  index={index}
                  isFollowing={followedSuggestionIds.has(item.id)}
                  onPressCard={() => onSelectUser(item.id)}
                  onDismiss={() => handleDismissSuggestion(item.id)}
                  onToggleFollow={() => handleToggleFollowSuggestion(item.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <ProfileTabBar
          tabs={TABS}
          activeTab={activeTab}
          onSelectTab={(key) => setActiveTab(key as 'videos' | 'liked')}
        />

        <VideoThumbnailGrid videos={displayedVideos} showHeartIcon={true} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
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
  },
  bio: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  mainFollowButton: {
    height: 44,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
  },
  mainFollowText: {
    fontSize: 15,
    fontWeight: '600',
  },
  suggestionsSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  viewMore: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  suggestionsList: {
    paddingLeft: 16,
    paddingRight: 16,
    gap: 8,
  },
});

