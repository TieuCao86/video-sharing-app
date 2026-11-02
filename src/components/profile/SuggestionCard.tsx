import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { Avatar } from '../common/Avatar';
import { CustomButton } from '../buttons/CustomButton';
import { ApiUser } from '../../types/user.type';

const PASTEL_COLORS = ['#FFE5EC', '#E5F0FF', '#F3E8FF'];

interface SuggestionCardProps {
  user: ApiUser;
  index: number;
  isFollowing?: boolean;
  onPressCard: () => void;
  onDismiss: () => void;
  onToggleFollow: () => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  user,
  index,
  isFollowing = false,
  onPressCard,
  onDismiss,
  onToggleFollow,
}) => {
  const pastelBg = PASTEL_COLORS[index % PASTEL_COLORS.length];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPressCard}
      style={styles.card}
    >
      <TouchableOpacity
        style={styles.dismissButton}
        onPress={onDismiss}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons name="close" size={14} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={[styles.avatarCircle, { backgroundColor: pastelBg }]}>
        <Avatar uri={user.avatar} size={48} />
      </View>

      <Text numberOfLines={1} style={styles.name}>
        {user.name}
      </Text>

      <CustomButton
        title={isFollowing ? 'Following' : 'Follow'}
        variant={isFollowing ? 'muted-outline' : 'primary'}
        onPress={onToggleFollow}
        style={styles.followButton}
        textStyle={styles.followText}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 108,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
    padding: 2,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginTop: 8,
    width: '100%',
  },
  followButton: {
    height: 32,
    borderRadius: 6,
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 8,
  },
  followText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

