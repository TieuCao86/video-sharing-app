import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { Avatar } from '../common/Avatar';
import { CustomButton } from '../buttons/CustomButton';
import { ApiUser } from '../../types/user.type';

interface UserListItemProps {
  user: ApiUser;
  isFollowing?: boolean;
  onPressRow: () => void;
  onToggleFollow: () => void;
  onOptionsPress?: () => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({
  user,
  isFollowing = true,
  onPressRow,
  onToggleFollow,
  onOptionsPress,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPressRow}
      style={styles.row}
    >
      <Avatar uri={user.avatar} size={36} />

      <Text numberOfLines={1} style={styles.name}>
        {user.name}
      </Text>

      <View style={styles.rightActions}>
        <CustomButton
          title={isFollowing ? 'Following' : 'Follow'}
          variant={isFollowing ? 'muted-outline' : 'primary'}
          onPress={onToggleFollow}
          style={styles.actionButton}
          textStyle={styles.actionButtonText}
        />

        <TouchableOpacity
          onPress={onOptionsPress}
          style={styles.moreButton}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  name: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 80,
    height: 32,
    borderRadius: 6,
    paddingHorizontal: 0,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    marginLeft: 8,
    padding: 2,
  },
});

