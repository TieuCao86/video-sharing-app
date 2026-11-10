import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../../constants/colors';
import { ApiUser } from '../../../types/user.type';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { Avatar } from '../../../components/common/Avatar';
import { StatsRow } from '../../../components/profile/StatsRow';
import {
  ProfileTabBar,
  TabItem,
} from '../../../components/profile/ProfileTabBar';
import { VideoThumbnailGrid } from '../../../components/profile/VideoThumbnailGrid';
import { PLACEHOLDER_VIEW_COUNT } from '../../../constants/profile';

interface MyProfileViewProps {
  user: ApiUser;
  allUsers: ApiUser[];
  onOpenFollowList: (tab: 'followers' | 'following') => void;
}

interface DraftVideo {
  id: string;
  thumbnail: string;
  views: string;
  isDraft: boolean;
}

const TABS: TabItem[] = [
  { key: 'my-videos', label: 'My Videos', iconName: 'play-outline' },
  { key: 'liked', label: 'Liked', iconName: 'heart-outline' },
  { key: 'drafts', label: 'Drafts', iconName: 'document-outline' },
];

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  user,
  allUsers,
  onOpenFollowList,
}) => {
  const [activeTab, setActiveTab] = useState<'my-videos' | 'liked' | 'drafts'>('my-videos');

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

  // Mock draft videos data
  const draftVideos = useMemo((): DraftVideo[] => [
    { id: 'draft-1', thumbnail: 'https://picsum.photos/seed/draft1/300/400', views: 'Draft', isDraft: true },
    { id: 'draft-2', thumbnail: 'https://picsum.photos/seed/draft2/300/400', views: 'Draft', isDraft: true },
    { id: 'draft-3', thumbnail: 'https://picsum.photos/seed/draft3/300/400', views: 'Draft', isDraft: true },
    { id: 'draft-4', thumbnail: 'https://picsum.photos/seed/draft4/300/400', views: 'Draft', isDraft: true },
    { id: 'draft-5', thumbnail: 'https://picsum.photos/seed/draft5/300/400', views: 'Draft', isDraft: true },
    { id: 'draft-6', thumbnail: 'https://picsum.photos/seed/draft6/300/400', views: 'Draft', isDraft: true },
  ], []);

  // Liked tab uses a different slice of the video list
  const displayedVideos = useMemo(() => {
    if (activeTab === 'liked') {
      const slice = videoItems.slice(2);
      return slice.length >= 6 ? slice : [...slice, ...videoItems.slice(0, 6 - slice.length)];
    }
    if (activeTab === 'drafts') {
      return draftVideos;
    }
    return videoItems;
  }, [activeTab, videoItems, draftVideos]);

  return (
    <View style={styles.screen}>
      <ProfileHeader type="A" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarWrapper}>
          <Avatar
            uri={user.avatar}
            size={80}
            ringColor={colors.primary}
            ringWidth={2}
            ringGap={3}
          />
        </View>

        <Text style={styles.name}>{user.name}</Text>

        <StatsRow
          following={user.following}
          followers={user.followers}
          likes={user.likes}
          onPressFollowing={() => onOpenFollowList('following')}
          onPressFollowers={() => onOpenFollowList('followers')}
        />

        <ProfileTabBar
          tabs={TABS}
          activeTab={activeTab}
          onSelectTab={(key) => setActiveTab(key as 'my-videos' | 'liked' | 'drafts')}
        />

        <VideoThumbnailGrid videos={displayedVideos} />
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
    marginBottom: 8,
  },
});

