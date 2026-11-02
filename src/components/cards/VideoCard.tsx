import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoItem } from '../../types/video.type';
import { PLACEHOLDER_VIEW_COUNT } from '../../constants/profile';

interface VideoCardProps {
  item:
    | VideoItem
    | {
        id: string;
        title?: string;
        thumbnail?: string;
        coverUrl?: string;
        views?: string;
        timeAgo?: string;
      };
  onPress?: () => void;
  type?: 'trending' | 'profile';
  showHeartIcon?: boolean;
}

const { width } = Dimensions.get('window');
const profileCardWidth = Math.floor((width - 32 - 12) / 3);
const profileCardHeight = Math.round((profileCardWidth * 4) / 3);

const isVideoItem = (obj: any): obj is VideoItem => {
  return 'stats' in obj && 'coverUrl' in obj;
};

export const VideoCard: React.FC<VideoCardProps> = ({
  item,
  onPress,
  type = 'trending',
  showHeartIcon = false,
}) => {
  const [loading, setLoading] = useState(true);

  const thumbnailUri = isVideoItem(item)
    ? item.coverUrl
    : item.coverUrl || item.thumbnail || '';
  const titleText = isVideoItem(item) ? item.caption : item.title || '';
  const viewsText = isVideoItem(item)
    ? item.stats.views
    : item.views || PLACEHOLDER_VIEW_COUNT;
  const timeAgoText = !isVideoItem(item) ? item.timeAgo : undefined;

  if (type === 'profile') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.profileCard}
      >
        {loading && (
          <View style={styles.skeleton}>
            <ActivityIndicator size="small" color="#888" />
          </View>
        )}
        <Image
          source={{ uri: thumbnailUri }}
          style={styles.profileThumbnail}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
        <View style={styles.profileBottomOverlay}>
          <View style={styles.viewsContainer}>
            <Ionicons name="play" size={12} color="#FFFFFF" />
            <Text style={styles.profileViewsText}>{viewsText}</Text>
          </View>
          {showHeartIcon && (
            <Ionicons name="heart-outline" size={14} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, styles.trendingCard]}
    >
      <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />

      <View style={styles.overlay}>
        {timeAgoText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{timeAgoText}</Text>
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text numberOfLines={1} style={styles.title}>
            {titleText}
          </Text>
          <Text style={styles.views}>▶ {viewsText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    marginRight: 12,
    marginBottom: 12,
  },
  trendingCard: {
    width: 150,
    height: 220,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileCard: {
    width: profileCardWidth,
    height: profileCardHeight,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#EFEFEF',
    position: 'relative',
  },
  skeleton: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  profileBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    zIndex: 2,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  profileViewsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  badge: {
    backgroundColor: 'rgba(255, 36, 66, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoContainer: {
    justifyContent: 'flex-end',
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  views: {
    color: '#ddd',
    fontSize: 11,
  },
});
