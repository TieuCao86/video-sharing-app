import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DraftItem } from '../../store/useDraftsStore';

const { width, height } = Dimensions.get('window');

const ActiveDraftVideo: React.FC<{ uri: string }> = ({ uri }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = true;
  });
  useFocusEffect(React.useCallback(() => {
    player.play();
    return () => player.pause();
  }, [player]));
  useEffect(() => {
    const status = player.addListener('statusChange', (event: any) => {
      if (event.status === 'readyToPlay') setLoading(false);
      if (event.status === 'error') {
        setError(event.error?.message || 'Failed to load video');
        setLoading(false);
      }
    });
    const playingChange = player.addListener('playingChange', (event: any) => setPlaying(event.isPlaying ?? player.playing));
    return () => { status.remove(); playingChange.remove(); };
  }, [player]);
  return (
    <TouchableOpacity style={styles.videoContainer} activeOpacity={1} onPress={() => player.playing ? player.pause() : player.play()}>
      <VideoView style={styles.video} player={player} allowsPictureInPicture nativeControls={false} />
      {!playing && !loading && !error && <View style={styles.playIconOverlay}><Ionicons name="play" size={80} color="rgba(255,255,255,0.9)" /></View>}
      {loading && <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#FF2442" /><Text style={styles.loadingText}>Loading draft video...</Text></View>}
      {error && <View style={styles.errorContainer}><Ionicons name="alert-circle-outline" size={48} color="#FF2442" /><Text style={styles.errorText}>{error}</Text></View>}
    </TouchableOpacity>
  );
};

interface DraftVideoItemProps {
  draft: DraftItem;
  isActive: boolean;
  onDelete: (draft: DraftItem) => void;
  onPublish: (draft: DraftItem) => void;
  isPublishing?: boolean;
}

export const DraftVideoItem: React.FC<DraftVideoItemProps> = ({
  draft,
  isActive,
  onDelete,
  onPublish,
  isPublishing = false,
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 16);

  return (
    <View style={styles.container}>
      {/* Video Player */}
      {isActive && <ActiveDraftVideo uri={draft.videoUrl} />}

      {/* Semi-transparent Overlay */}
      <View style={styles.overlay} pointerEvents="none" />

      {/* Right Actions Column - Reusing exact styling from feed */}
      {/* Contains ONLY Delete and Publish */}
      <View
        style={[
          styles.rightActionsContainer,
          { bottom: 80 + bottomOffset },
        ]}
      >
        {/* 1. Delete Action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(draft)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Delete"
        >
          <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>

        {/* 2. Publish Action */}
        <TouchableOpacity
          style={[styles.actionButton, isPublishing && { opacity: 0.5 }]}
          onPress={() => onPublish(draft)}
          disabled={isPublishing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Publish"
        >
          <Ionicons name="cloud-upload-outline" size={28} color="#FFFFFF" />
          <Text style={styles.actionText}>Publish</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info: Title & Draft Badge */}
      <View
        style={[
          styles.bottomInfoContainer,
          { bottom: 16 + bottomOffset },
        ]}
      >
        <View style={styles.draftBadgeRow}>
          <View style={styles.draftBadge}>
            <Text style={styles.draftBadgeText}>Draft</Text>
          </View>
          {draft.duration ? (
            <Text style={styles.draftDurationText}>{draft.duration}</Text>
          ) : null}
        </View>
        <Text style={styles.draftTitleText} numberOfLines={2}>
          {draft.title}
        </Text>
        {draft.audioTitle ? (
          <Text style={styles.draftUpdatedText} numberOfLines={1}>
            {draft.audioTitle}
          </Text>
        ) : null}
        <Text style={styles.draftUpdatedText}>
          Last updated {draft.updatedAt}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: '#000000',
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
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  rightActionsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 100,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfoContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    width: '75%',
  },
  draftBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  draftBadge: {
    backgroundColor: '#FF2442',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  draftBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  draftDurationText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  draftTitleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  draftUpdatedText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
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
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
});
