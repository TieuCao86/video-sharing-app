import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
  audioUrl: string;
}

const MOCK_AUDIO_TRACKS: AudioTrack[] = [
  {
    id: 'a1',
    title: 'Quá đủ rồi',
    artist: 'CoolKid',
    duration: '04:03',
    thumbnail: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/ArtistImage/quaduroi.jfif',
    audioUrl: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Music/QUA%20DU%20ROI%20-%20COOLKID.mp3',
  },
  {
    id: 'a2',
    title: 'Người Im Lặng Gặp Người Hay Nói',
    artist: 'HIEUTHUHAI',
    duration: '05:22',
    thumbnail: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/ArtistImage/c0742c35795d4d234bf86cc7258b5077.jpg',
    audioUrl: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Music/nguoiimlanggapnguoihaynoi.mp3',
  },
  {
    id: 'a3',
    title: 'Sunny',
    artist: 'Summer Vibes',
    duration: '00:30',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'a4',
    title: 'Flowers',
    artist: 'Nature Sounds',
    duration: '00:30',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'a5',
    title: 'Morning coffee',
    artist: 'Chill Beats',
    duration: '00:30',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 'a6',
    title: 'City lights',
    artist: 'Urban Life',
    duration: '00:30',
    thumbnail: 'https://images.unsplash.com/photo-1477233534935-f5e6fe7c1159?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    id: 'a7',
    title: 'Ocean waves',
    artist: 'Relaxing',
    duration: '00:30',
    thumbnail: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  },
  {
    id: 'a8',
    title: 'Happy moments',
    artist: 'Feel Good',
    duration: '00:30',
    thumbnail: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
];

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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentSource, setCurrentSource] = useState<string | null>(null);

  // Create player with source
  const player = useAudioPlayer(currentSource || undefined);
  const status = useAudioPlayerStatus(player);

  const filteredAudio = MOCK_AUDIO_TRACKS.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Debug: log status changes
  useEffect(() => {
    console.log('Player status:', {
      playing: status.playing,
      isLoaded: status.isLoaded,
      currentTime: status.currentTime,
      duration: status.duration,
    });
  }, [status.playing, status.isLoaded]);

  // Auto play when loaded
  useEffect(() => {
    if (status.isLoaded && playingId && !status.playing) {
      console.log('Auto playing after load...');
      player.play();
    }
  }, [status.isLoaded, playingId]);

  // Stop audio when modal closes
  useEffect(() => {
    if (!visible && status.playing) {
      player.pause();
      setPlayingId(null);
    }
  }, [visible]);

  const handleUseAudio = (audio: AudioTrack) => {
    onSelectAudio(audio);
    onClose();
  };

  const handlePlayPause = (audio: AudioTrack) => {
    console.log('=== handlePlayPause ===');
    console.log('Audio:', audio.title);
    console.log('Current playingId:', playingId);
    console.log('Status playing:', status.playing);

    // If already playing this track, pause it
    if (playingId === audio.id && status.playing) {
      console.log('Action: Pausing');
      player.pause();
      setPlayingId(null);
      return;
    }

    // If same track but paused, just resume
    if (playingId === audio.id && !status.playing && status.isLoaded) {
      console.log('Action: Resuming');
      player.play();
      return;
    }

    // Load new track
    console.log('Action: Loading new track');
    console.log('URL:', audio.audioUrl);
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
            {filteredAudio.map((audio) => (
              <View key={audio.id} style={styles.audioItem}>
                {/* Thumbnail with Play Button */}
                <TouchableOpacity
                  style={styles.thumbnailContainer}
                  onPress={() => handlePlayPause(audio)}
                >
                  <Image
                    source={{ uri: audio.thumbnail }}
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
                  <Text style={styles.audioDuration}>{audio.duration}</Text>
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

            {filteredAudio.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="musical-notes-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No audio found</Text>
              </View>
            )}
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
  },
});
