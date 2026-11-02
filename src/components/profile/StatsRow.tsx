import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface StatsRowProps {
  following: number;
  followers: number;
  likes?: number;
  onPressFollowing?: () => void;
  onPressFollowers?: () => void;
  onPressLikes?: () => void;
}

export const StatsRow: React.FC<StatsRowProps> = ({
  following,
  followers,
  likes,
  onPressFollowing,
  onPressFollowers,
  onPressLikes,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.statItem}
        onPress={onPressFollowing}
        disabled={!onPressFollowing}
        activeOpacity={0.7}
      >
        <Text style={styles.count}>{following}</Text>
        <Text style={styles.label}>Following</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.statItem}
        onPress={onPressFollowers}
        disabled={!onPressFollowers}
        activeOpacity={0.7}
      >
        <Text style={styles.count}>{followers}</Text>
        <Text style={styles.label}>Followers</Text>
      </TouchableOpacity>

      {likes !== undefined && (
        <TouchableOpacity
          style={styles.statItem}
          onPress={onPressLikes}
          disabled={!onPressLikes}
          activeOpacity={0.7}
        >
          <Text style={styles.count}>{likes}</Text>
          <Text style={styles.label}>Like</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  count: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  label: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 3,
  },
});

