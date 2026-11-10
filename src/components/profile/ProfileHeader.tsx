import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { Avatar } from '../common/Avatar';

interface BaseHeaderProps {
  onBack?: () => void;
  onEditProfile?: () => void;
  onOptions?: () => void;
  onSearch?: () => void;
}

interface HeaderAProps extends BaseHeaderProps {
  type: 'A';
}

interface HeaderBProps extends BaseHeaderProps {
  type: 'B';
}

interface HeaderCProps extends BaseHeaderProps {
  type: 'C';
  ownerName: string;
  ownerAvatar: string;
}

type ProfileHeaderProps = HeaderAProps | HeaderBProps | HeaderCProps;

export const ProfileHeader: React.FC<ProfileHeaderProps> = (props) => {
  if (props.type === 'A') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={props.onEditProfile}
          activeOpacity={0.7}
        >
          <Ionicons
            name="pencil"
            size={14}
            color={colors.primary}
            style={styles.pencilIcon}
          />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={props.onOptions}
          activeOpacity={0.7}
        >
          <Ionicons name="menu-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    );
  }

  if (props.type === 'B') {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={props.onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={props.onOptions}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={22}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerLeftC}>
        <TouchableOpacity
          onPress={props.onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.ownerAvatarWrapper}>
          <Avatar uri={props.ownerAvatar} size={32} />
        </View>
        <Text numberOfLines={1} style={styles.ownerName}>
          {props.ownerName}
        </Text>
      </View>

      <TouchableOpacity
        onPress={props.onSearch}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="search-outline" size={22} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pencilIcon: {
    marginRight: 4,
  },
  editProfileText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerLeftC: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  ownerAvatarWrapper: {
    marginLeft: 8,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
});

