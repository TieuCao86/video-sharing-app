import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

// Mock data - same as other screens
const MOCK_AUDIO_TRACKS = [
  {
    id: 'a1',
    title: 'Beautiful lady',
    artist: 'Bookcase',
    duration: '04:03',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'a2',
    title: 'Nice day',
    artist: 'Sunshine',
    duration: '03:45',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'a3',
    title: 'Sunny',
    artist: 'Summer Vibes',
    duration: '05:22',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'a4',
    title: 'Flowers',
    artist: 'Nature Sounds',
    duration: '03:30',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'a5',
    title: 'Morning coffee',
    artist: 'Chill Beats',
    duration: '04:15',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
  {
    id: 'a6',
    title: 'City lights',
    artist: 'Urban Life',
    duration: '03:58',
    thumbnail: 'https://images.unsplash.com/photo-1477233534935-f5e6fe7c1159?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  },
  {
    id: 'a7',
    title: 'Ocean waves',
    artist: 'Relaxing',
    duration: '05:10',
    thumbnail: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  },
  {
    id: 'a8',
    title: 'Happy moments',
    artist: 'Feel Good',
    duration: '03:20',
    thumbnail: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  },
  {
    id: 'a9',
    title: 'Dreamy night',
    artist: 'Moonlight',
    duration: '04:42',
    thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: 'a10',
    title: 'Energetic',
    artist: 'Workout',
    duration: '03:35',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: 'a11',
    title: 'Chill vibes',
    artist: 'Lofi Beats',
    duration: '04:50',
    thumbnail: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'a12',
    title: 'Summer breeze',
    artist: 'Tropical',
    duration: '03:28',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
];

export const AudioListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePlayAudio = (audio: typeof MOCK_AUDIO_TRACKS[0]) => {
    if (currentAudioId === audio.id && status.playing) {
      // Pause if already playing this audio
      player.pause();
    } else if (currentAudioId === audio.id && !status.playing) {
      // Resume if paused
      player.play();
    } else {
      // Play new audio
      player.replace(audio.audioUrl);
      setCurrentAudioId(audio.id);
    }
  };

  const renderAudioItem = ({ item, index }: { item: typeof MOCK_AUDIO_TRACKS[0]; index: number }) => (
    <View style={styles.audioItem}>
      <View style={styles.audioItemContent}>
        {/* Thumbnail */}
        <View style={styles.thumbnailWrapper}>
          <Image 
            source={{ uri: item.thumbnail }}
            style={styles.thumbnailImage}
          />
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => handlePlayAudio(item)}
          >
            <Ionicons 
              name={currentAudioId === item.id && status.playing ? 'pause' : 'play'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.infoWrapper}>
          <Text style={styles.audioTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.audioArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>

        {/* More button */}
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>All Audio</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Audio List */}
      <FlatList
        data={MOCK_AUDIO_TRACKS}
        renderItem={renderAudioItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    paddingVertical: 8,
  },
  audioItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  audioItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  thumbnailWrapper: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  audioArtist: {
    fontSize: 13,
    color: '#666',
  },
  moreButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
