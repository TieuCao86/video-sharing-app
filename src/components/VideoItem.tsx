import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VideoData {
  id: string;
  url: string;
  creator: string;
  creatorAvatar: string;
  canFollow: boolean;
  isFollowing: boolean;
  caption: string;
  audio: string;
}

interface VideoItemProps {
  video: VideoData;
  isActive: boolean;
  itemHeight: number;
  onCommentPress: () => void;
  likes: number;
  isLiked: boolean;
  onLikePress: () => void;
  commentsCount: number;
  onFollowPress: () => void;
  isFollowLoading: boolean;
}

export const VideoItem: React.FC<VideoItemProps> = ({
  video,
  isActive,
  itemHeight,
  onCommentPress,
  likes,
  isLiked,
  onLikePress,
  commentsCount,
  onFollowPress,
  isFollowLoading,
}) => {
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 20);

  // Create video player
  const player = useVideoPlayer(video.url, (p) => {
    p.loop = true;
  });

  // Auto play/pause based on visibility
  useEffect(() => {
    if (isActive) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isActive, player]);

  // Monitor player status
  useEffect(() => {
    const subscription = player.addListener('statusChange', () => {
      if (player.status === 'readyToPlay') {
        setIsVideoLoading(false);
      }
      
      if (player.status === 'error') {
        setVideoError('Failed to load video');
        setIsVideoLoading(false);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  const handleTogglePlayPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  return (
    <View style={[styles.container, { height: itemHeight }]}>
      {/* Video Player */}
      <TouchableOpacity 
        style={styles.videoContainer}
        activeOpacity={1}
        onPress={handleTogglePlayPause}
      >
        <VideoView
          style={styles.video}
          player={player}
          contentFit="contain"
          allowsPictureInPicture
          nativeControls={false}
        />
        
        {/* Play/Pause Icon Overlay */}
        {!isPlaying && !isVideoLoading && (
          <View style={styles.playIconOverlay}>
            <Ionicons name="play" size={80} color="rgba(255,255,255,0.9)" />
          </View>
        )}
      </TouchableOpacity>

      {/* Loading Indicator */}
      {isVideoLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF2442" />
          <Text style={styles.loadingText}>Loading video...</Text>
        </View>
      )}

      {/* Error Message */}
      {videoError && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF2442" />
          <Text style={styles.errorText}>Failed to load video</Text>
        </View>
      )}

      {/* Overlay gradient/shade */}
      <View style={styles.overlay} pointerEvents="none" />

      {/* Right Actions (Like, Comment, Share) */}
      <View style={[styles.rightActionsContainer, { bottom: 60 + bottomOffset }]}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: video.creatorAvatar }}
            style={styles.creatorAvatar}
          />
          {video.canFollow ? (
            <TouchableOpacity
              style={[styles.plusBadge, video.isFollowing && styles.followingBadge]}
              onPress={onFollowPress}
              disabled={isFollowLoading}
              accessibilityRole="button"
              accessibilityLabel={video.isFollowing ? 'Unfollow creator' : 'Follow creator'}
              hitSlop={8}
            >
              {isFollowLoading ? (
                <ActivityIndicator size="small" color={video.isFollowing ? '#FF2442' : '#FFFFFF'} />
              ) : (
                <Ionicons
                  name={video.isFollowing ? 'checkmark' : 'add'}
                  size={12}
                  color={video.isFollowing ? '#FF2442' : '#FFFFFF'}
                />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={onLikePress}>
          <Ionicons
            name={isLiked ? "heart" : "heart-outline"}
            size={32}
            color={isLiked ? "#FF2442" : "#FFFFFF"}
          />
          <Text style={styles.actionText}>
            {likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
          <Ionicons name="chatbubble-outline" size={28} color="#FFFFFF" />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-redo-outline" size={28} color="#FFFFFF" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info (Creator, Caption, Music) */}
      <View style={[styles.bottomInfoContainer, { bottom: 12 + bottomOffset }]}>
        <Text style={styles.creatorName}>@{video.creator}</Text>
        <Text style={styles.caption} numberOfLines={2}>{video.caption}</Text>

        <View style={styles.audioRow}>
          <Ionicons name="musical-note" size={14} color="#FFFFFF" />
          <Text style={styles.audioText} numberOfLines={1}>
            {" "}{video.audio}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  videoContainer: {
    ...StyleSheet.absoluteFill,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  rightActionsContainer: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    zIndex: 20,
  },
  avatarWrapper: {
    marginBottom: 18,
    position: 'relative',
  },
  creatorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  plusBadge: {
    position: 'absolute',
    bottom: -4,
    alignSelf: 'center',
    backgroundColor: '#FF2442',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingBadge: {
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  bottomInfoContainer: {
    position: 'absolute',
    left: 16,
    right: 80,
    zIndex: 20,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  caption: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 12,
    fontWeight: '600',
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 10,
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
