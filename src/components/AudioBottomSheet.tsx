import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { AudioTrackItem, getAudioTracks, searchAudioTracks } from '../services';

export type AudioTrack = AudioTrackItem;

interface AudioBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAudio: (audio: AudioTrack | null) => void;
  selectedAudio: AudioTrack | null;
}

export const AudioBottomSheet: React.FC<AudioBottomSheetProps> = ({
  visible,
  onClose,
  onSelectAudio,
  selectedAudio,
}: AudioBottomSheetProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Create player with source
  const player = useAudioPlayer(currentSource || undefined);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (!visible) return;

    let active = true;
    const requestId = ++requestIdRef.current;
    const timer = setTimeout(() => {
      const loadTracks = async () => {
        setLoadingTracks(true);
        setTracksError(null);
        try {
          const query = searchQuery.trim();
          const tracks = query ? await searchAudioTracks(query) : await getAudioTracks(50);
          if (active && requestId === requestIdRef.current) setAudioTracks(tracks);
        } catch (error) {
          console.error('Error loading audio for recording:', error);
          if (active && requestId === requestIdRef.current) {
            setTracksError('Could not load audio. Check your connection and try again.');
          }
        } finally {
          if (active && requestId === requestIdRef.current) setLoadingTracks(false);
        }
      };

      void loadTracks();
    }, searchQuery.trim() ? 350 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [visible, searchQuery, retryCount]);

  // Setup audio mode on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        });
        console.log('Audio mode configured');
      } catch (error) {
        console.error('Error setting audio mode:', error);
      }
    };
    setupAudio();
  }, []);

  // Auto play when loaded
  useEffect(() => {
    if (status.isLoaded && playingId && !status.playing) {
      player.play();
    }
  }, [status.isLoaded, status.playing, playingId, player]);

  // Stop audio when modal closes
  useEffect(() => {
    if (!visible && status.playing) {
      player.pause();
    }
  }, [visible, player, status.playing]);

  const handleUseAudio = (audio: AudioTrack) => {
    onSelectAudio(audio);
    onClose();
  };

  const handlePlayPause = (audio: AudioTrack) => {
    // If already playing this track, pause it
    if (playingId === audio.id && status.playing) {
      player.pause();
      setPlayingId(null);
      return;
    }

    // If same track but paused, just resume
    if (playingId === audio.id && !status.playing && status.isLoaded) {
      player.play();
      return;
    }

    // Load new track
    setPlayingId(audio.id);
    setCurrentSource(audio.audioUrl);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add audio</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.searchButton}
                onPress={() => { }}
              >
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search audio..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Audio List */}
          <ScrollView
            style={styles.audioScroll}
            showsVerticalScrollIndicator={false}
          >
            {loadingTracks && audioTracks.length === 0 ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color="#FF2D55" />
                <Text style={styles.emptyText}>Loading audio...</Text>
              </View>
            ) : tracksError && audioTracks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cloud-offline-outline" size={44} color="#ccc" />
                <Text style={styles.emptyText}>{tracksError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => setRetryCount((count) => count + 1)}
                >
                  <Text style={styles.retryButtonText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : audioTracks.map((audio) => (
              <View key={audio.id} style={styles.audioItem}>
                {/* Thumbnail with Play Button */}
                <TouchableOpacity
                  style={styles.thumbnailContainer}
                  onPress={() => handlePlayPause(audio)}
                >
                  <Image
                    source={{ uri: audio.thumbnailUrl || 'https://via.placeholder.com/150' }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.playOverlay}>
                    <Ionicons
                      name={playingId === audio.id && player.playing ? 'pause' : 'play'}
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                </TouchableOpacity>

                {/* Audio Info */}
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle} numberOfLines={1}>
                    {audio.title}
                  </Text>
                  <Text style={styles.audioDuration} numberOfLines={1}>
                    {audio.artist} · {audio.durationFormatted}
                  </Text>
                </View>

                {/* Use Button */}
                <TouchableOpacity
                  style={[
                    styles.useButton,
                    selectedAudio?.id === audio.id && styles.useButtonActive
                  ]}
                  onPress={() => handleUseAudio(audio)}
                >
                  <Text style={[
                    styles.useButtonText,
                    selectedAudio?.id === audio.id && styles.useButtonTextActive
                  ]}>
                    {selectedAudio?.id === audio.id ? 'Using' : 'Use'}
                  </Text>
                </TouchableOpacity>

                {/* More Options */}
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            ))}

            {!loadingTracks && !tracksError && audioTracks.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No audio found</Text>
              </View>
            )}
            {loadingTracks && audioTracks.length > 0 ? (
              <ActivityIndicator style={styles.listLoader} color="#FF2D55" />
            ) : null}
            {tracksError && audioTracks.length > 0 ? (
              <TouchableOpacity
                style={styles.inlineError}
                onPress={() => setRetryCount((count) => count + 1)}
              >
                <Text style={styles.inlineErrorText}>{tracksError} Tap to retry.</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  searchButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },

  // Audio List
  audioScroll: {
    flex: 1,
  },
  audioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  thumbnailContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  audioDuration: {
    fontSize: 13,
    color: '#666',
  },
  useButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#FF2D55',
    backgroundColor: '#FFFFFF',
  },
  useButtonActive: {
    backgroundColor: '#FF2D55',
  },
  useButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF2D55',
  },
  useButtonTextActive: {
    color: '#FFFFFF',
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#FF2D55',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listLoader: {
    marginVertical: 12,
  },
  inlineError: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  inlineErrorText: {
    color: '#C62828',
    textAlign: 'center',
  },
});
