import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { ApiUser } from '../../../types/user.type';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import {
  ProfileTabBar,
  TabItem,
} from '../../../components/profile/ProfileTabBar';
import { UserListItem } from '../../../components/profile/UserListItem';
import { useAuthStore } from '../../../store/useAuthStore';
import { getFollowList, toggleFollowUser, UserProfileItem } from '../../../services/userService';

interface FollowListViewProps {
  owner: ApiUser;
  allUsers?: ApiUser[];
  initialTab?: 'followers' | 'following';
  onBack: () => void;
  onSelectUser: (userId: string) => void;
}

export const FollowListView: React.FC<FollowListViewProps> = ({
  owner,
  initialTab = 'following',
  onBack,
  onSelectUser,
}) => {
  const { user: authUser, checkAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [loading, setLoading] = useState<boolean>(true);
  const [usersList, setUsersList] = useState<UserProfileItem[]>([]);
  const [followOverrides, setFollowOverrides] = useState<Record<string, boolean>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getFollowList(owner.id, activeTab, authUser?.id, true);
      setUsersList(list);
      setFollowOverrides({});
    } catch (err) {
      console.error('Error fetching follow list:', err);
    } finally {
      setLoading(false);
    }
  }, [owner.id, activeTab, authUser?.id]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const filteredUsers = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    if (!query) return usersList;
    return usersList.filter((user) => {
      const name = normalizeSearch(user.name || '');
      const bio = normalizeSearch(user.bio || '');
      return name.includes(query) || bio.includes(query);
    });
  }, [usersList, searchQuery]);

  const tabs: [TabItem, TabItem] = useMemo(
    () => [
      { key: 'followers', label: `${owner.followers} followers` },
      { key: 'following', label: `${owner.following} following` },
    ],
    [owner.followers, owner.following]
  );

  const handleToggleFollow = (targetId: string) => {
    checkAuth(async () => {
      if (!authUser?.id) return;
      try {
        const isNowFollowing = await toggleFollowUser(authUser.id, targetId);
        setFollowOverrides((prev) => ({ ...prev, [targetId]: isNowFollowing }));
      } catch (err) {
        console.error('Error toggling follow:', err);
      }
    });
  };

  return (
    <View style={styles.screen}>
      <ProfileHeader
        type="C"
        ownerName={owner.name}
        ownerAvatar={owner.avatar}
        onBack={onBack}
        onSearch={() => {
          setSearchQuery('');
          setSearchOpen((open) => !open);
        }}
      />

      {searchOpen && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999999" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={
              activeTab === 'followers' ? 'Tìm người theo dõi' : 'Tìm người đang theo dõi'
            }
            placeholderTextColor="#999999"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#999999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ProfileTabBar
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(key) => setActiveTab(key as 'followers' | 'following')}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? 'Không tìm thấy người dùng phù hợp.'
              : activeTab === 'followers'
                ? 'Chưa có người theo dõi nào.'
                : 'Chưa theo dõi người dùng nào.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isFollowing = followOverrides[item.id] ?? item.isFollowing ?? false;
            return (
              <UserListItem
                user={{
                  id: item.id,
                  name: item.name,
                  avatar: item.avatar,
                  following: item.following,
                  followers: item.followers,
                  likes: item.likes,
                  videos: '',
                  bio: item.bio,
                }}
                isFollowing={isFollowing}
                onPressRow={() => onSelectUser(item.id)}
                onToggleFollow={() => handleToggleFollow(item.id)}
              />
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
  },
});
