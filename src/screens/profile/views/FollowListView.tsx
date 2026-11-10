import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { colors } from '../../../constants/colors';
import { ApiUser } from '../../../types/user.type';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import {
  ProfileTabBar,
  TabItem,
} from '../../../components/profile/ProfileTabBar';
import { UserListItem } from '../../../components/profile/UserListItem';
import { useAuthStore } from '../../../store/useAuthStore';

interface FollowListViewProps {
  owner: ApiUser;
  allUsers: ApiUser[];
  initialTab?: 'followers' | 'following';
  onBack: () => void;
  onSelectUser: (userId: string) => void;
}

export const FollowListView: React.FC<FollowListViewProps> = ({
  owner,
  allUsers,
  initialTab = 'following',
  onBack,
  onSelectUser,
}) => {
  const { checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(
    initialTab
  );
  // Track local following toggles for each row
  const [unfollowedUserIds, setUnfollowedUserIds] = useState<Set<string>>(
    new Set()
  );

  const tabs: [TabItem, TabItem] = useMemo(
    () => [
      { key: 'followers', label: `${owner.followers} followers` },
      { key: 'following', label: `${owner.following} following` },
    ],
    [owner.followers, owner.following]
  );

  const listUsers = useMemo(() => {
    return allUsers.filter((u) => u.id !== owner.id);
  }, [allUsers, owner.id]);

  const handleToggleFollow = (id: string) => {
    checkAuth(() => {
      setUnfollowedUserIds((prev) => {
        const updated = new Set(prev);
        if (updated.has(id)) {
          updated.delete(id);
        } else {
          updated.add(id);
        }
        return updated;
      });
    });
  };

  return (
    <View style={styles.screen}>
      <ProfileHeader
        type="C"
        ownerName={owner.name}
        ownerAvatar={owner.avatar}
        onBack={onBack}
      />

      <ProfileTabBar
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(key) => setActiveTab(key as 'followers' | 'following')}
      />

      <FlatList
        data={listUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserListItem
            user={item}
            isFollowing={!unfollowedUserIds.has(item.id)}
            onPressRow={() => onSelectUser(item.id)}
            onToggleFollow={() => handleToggleFollow(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 24,
  },
});

