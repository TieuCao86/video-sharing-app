import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  Text,
  ActivityIndicator,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { colors } from '../../constants/colors';
import { ApiUser } from '../../types/user.type';
import { fetchUsers } from '../../api/userApi';
import { DEFAULT_CURRENT_USER_ID } from '../../constants/profile';
import { CustomButton } from '../../components/buttons/CustomButton';
import { MyProfileView } from './views/MyProfileView';
import { UserProfileView } from './views/UserProfileView';
import { FollowListView } from './views/FollowListView';
import { useAuthStore } from '../../store/useAuthStore';
import { LoginRequiredModal } from '../../components/auth/LoginRequiredModal';

type ViewState =
  | { type: 'A' }
  | { type: 'B'; userId: string }
  | { type: 'C'; ownerId: string; initialTab: 'followers' | 'following' };

export const ProfileScreen: React.FC = () => {
  const { user: authUser } = useAuthStore();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<ViewState[]>([{ type: 'A' }]);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchUsers()
      .then((data) => {
        setUsers(data);
      })
      .catch((err: any) => {
        setError(err?.message || 'Failed to load profile data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchUsers()
      .then((data) => {
        if (isMounted) {
          setUsers(data);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err?.message || 'Failed to load profile data');
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const popView = useCallback(() => {
    setHistory((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (history.length > 1) {
          popView();
          return true;
        }
        return false;
      }
    );
    return () => subscription.remove();
  }, [history.length, popView]);

  const pushView = (next: ViewState) => {
    setHistory((prev) => [...prev, next]);
  };

  const handleToggleFollowProfile = (id: string) => {
    setFollowedUserIds((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || users.length === 0) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || 'Unable to load profile data.'}
        </Text>
        <CustomButton
          title="Retry"
          onPress={loadUsers}
          style={styles.retryButton}
        />
      </SafeAreaView>
    );
  }

  // "Me" defaults to constant DEFAULT_CURRENT_USER_ID ('1'), merged with store updates
  const baseUser =
    users.find((u) => u.id === DEFAULT_CURRENT_USER_ID) || users[0];
  const myUser = {
    ...baseUser,
    ...(authUser || {}),
  };

  const currentView = history[history.length - 1];

  let content: React.ReactNode = null;

  if (currentView.type === 'A') {
    content = (
      <MyProfileView
        user={myUser}
        allUsers={users}
        onOpenFollowList={(tab) =>
          pushView({ type: 'C', ownerId: myUser.id, initialTab: tab })
        }
      />
    );
  } else if (currentView.type === 'B') {
    const targetUser = users.find((u) => u.id === currentView.userId) || users[0];
    content = (
      <UserProfileView
        user={targetUser}
        currentUserId={myUser.id}
        allUsers={users}
        onBack={popView}
        onSelectUser={(userId) => pushView({ type: 'B', userId })}
        isFollowing={followedUserIds.has(targetUser.id)}
        onToggleFollowProfile={() => handleToggleFollowProfile(targetUser.id)}
      />
    );
  } else if (currentView.type === 'C') {
    const owner = users.find((u) => u.id === currentView.ownerId) || myUser;
    content = (
      <FollowListView
        owner={owner}
        allUsers={users}
        initialTab={currentView.initialTab}
        onBack={popView}
        onSelectUser={(userId) => pushView({ type: 'B', userId })}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {content}
      <LoginRequiredModal />
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    height: 40,
  },
});
