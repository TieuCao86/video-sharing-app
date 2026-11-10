import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { MOCK_VIDEOS_ARRAY } from '../../reel/ReelDetailScreen';
import { useDraftsStore } from '../../../store/useDraftsStore';

interface MyProfileViewProps {
  user: ApiUser;
  allUsers: ApiUser[];
  onOpenFollowList: (tab: 'followers' | 'following') => void;
}

const TABS: TabItem[] = [
  { key: 'my-videos', label: 'My Videos', iconName: 'play-outline' },
  { key: 'liked', label: 'Liked', iconName: 'heart-outline' },
];

const getRandomVideoId = (): string => {
  if (MOCK_VIDEOS_ARRAY.length === 0) return '1';
  const index = Math.floor(Math.random() * MOCK_VIDEOS_ARRAY.length);
  return MOCK_VIDEOS_ARRAY[index].id;
};

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  user,
  allUsers,
  onOpenFollowList,
}) => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'my-videos' | 'liked'>('my-videos');
  const { publishedVideos } = useDraftsStore();

  // Fill grid with published drafts first, then owner's video, then other users' videos
  const videoItems = useMemo(() => {
    const publishedItems = publishedVideos.map((pv) => ({
      id: pv.id,
      thumbnail: pv.thumbnail,
      views: pv.views || PLACEHOLDER_VIEW_COUNT,
    }));

    const otherUsers = allUsers.filter((u) => u.id !== user.id);
    const combined = [
      ...publishedItems,
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
  }, [publishedVideos, user, allUsers]);

  // Liked tab uses a different slice of the video list
  const displayedVideos = useMemo(() => {
    if (activeTab === 'liked') {
      const slice = videoItems.slice(2);
      return slice.length >= 6 ? slice : [...slice, ...videoItems.slice(0, 6 - slice.length)];
    }
    return videoItems;
  }, [activeTab, videoItems]);

  const handleVideoPress = () => {
    const videoId = getRandomVideoId();
    navigation.navigate('ReelDetail', { videoId });
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.screen}>
      <ProfileHeader
        type="A"
        onEditProfile={handleEditProfile}
        onOptions={handleOpenSettings}
      />

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
        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

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
          onSelectTab={(key) => setActiveTab(key as 'my-videos' | 'liked')}
        />

        <VideoThumbnailGrid
          videos={displayedVideos}
          onVideoPress={handleVideoPress}
        />
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
});
