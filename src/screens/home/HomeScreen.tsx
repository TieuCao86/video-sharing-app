import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StoryList } from '../../components/cards/StoryList';
import { BrowseTopics } from '../../components/cards/BrowseTopics';
import { VideoCard } from '../../components/cards/VideoCard';
import { AudioCard } from '../../components/AudioCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Story, TopTrendingItem, BrowseTopic } from '../../types/video.type';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

// Dữ liệu mẫu chuẩn khớp với thiết kế giao diện
const mockStories: Story[] = [
  { id: '1', name: 'You', avatar: 'https://example.com/avatar1.jpg', hasStory: true },
  { id: '2', name: 'Adam', avatar: 'https://example.com/avatar2.jpg', hasStory: true },
  { id: '3', name: 'William', avatar: 'https://example.com/avatar3.jpg', hasStory: true },
  { id: '4', name: 'Peter', avatar: 'https://example.com/avatar4.jpg', hasStory: true },
  { id: '5', name: 'Julia', avatar: 'https://example.com/avatar5.jpg', hasStory: true },
  { id: '6', name: 'Ro', avatar: 'https://example.com/avatar6.jpg', hasStory: false },
];

const mockTrending: TopTrendingItem[] = [
  { 
    id: '1', 
    title: 'Amazing sunset timelapse', 
    views: '1.5M views', 
    thumbnail: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500', 
    timeAgo: '1 min ago', 
    creator: { id: 'u1', name: 'Laura', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' } 
  },
  { 
    id: '2', 
    title: 'Travel vlog - Paris adventure', 
    views: '982K views', 
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500', 
    timeAgo: '15 min ago', 
    creator: { id: 'u2', name: 'William', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' } 
  },
  { 
    id: '3', 
    title: 'Cute cat playing with toy', 
    views: '2.1M views', 
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500', 
    timeAgo: '1 hour ago', 
    creator: { id: 'u3', name: 'Julia', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100' } 
  },
  { 
    id: '4', 
    title: 'How to cook perfect pasta', 
    views: '756K views', 
    thumbnail: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=500', 
    timeAgo: '2 hours ago', 
    creator: { id: 'u4', name: 'Peter', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100' } 
  },
  { 
    id: '5', 
    title: 'Epic mountain climbing', 
    views: '1.8M views', 
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500', 
    timeAgo: '3 hours ago', 
    creator: { id: 'u5', name: 'Adam', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' } 
  },
  { 
    id: '6', 
    title: 'Dance performance highlights', 
    views: '1.2M views', 
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500', 
    timeAgo: '5 hours ago', 
    creator: { id: 'u6', name: 'Liz', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' } 
  },
];

const mockAudios = [
  {
    id: 'a1',
    title: 'Quá đủ rồi',
    artist: 'CoolKid',
    thumbnail: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/ArtistImage/quaduroi.jfif',
    audioUrl: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Music/QUA%20DU%20ROI%20-%20COOLKID.mp3',
  },
  {
    id: 'a2',
    title: 'Người Im Lặng Gặp Người Hay Nói',
    artist: 'HIEUTHUHAI',
    thumbnail: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/ArtistImage/c0742c35795d4d234bf86cc7258b5077.jpg',
    audioUrl: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Music/nguoiimlanggapnguoihaynoi.mp3',
  },
  {
    id: 'a3',
    title: 'Sunny',
    artist: 'Summer Vibes',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
  {
    id: 'a4',
    title: 'Flowers',
    artist: 'Nature Sounds',
    thumbnail: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  },
  {
    id: 'a5',
    title: 'Morning coffee',
    artist: 'Chill Beats',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  },
];

const mockTopics: BrowseTopic[] = [
  { id: 't1', name: 'Sports', icon: 'bicycle-outline' },
  { id: 't2', name: 'Podcasts', icon: 'mic-outline' },
  { id: 't3', name: 'News', icon: 'document-text-outline' },
  { id: 't4', name: 'Travel', icon: 'globe-outline' },
  { id: 't5', name: 'Health', icon: 'heart-outline' },
  { id: 't6', name: 'Weather', icon: 'cloud-outline' },
  { id: 't7', name: 'Art', icon: 'color-palette-outline' },
  // Additional topics (hidden initially, shown when expanded)
  { id: 't8', name: 'Music', icon: 'musical-notes-outline' },
  { id: 't9', name: 'Food', icon: 'restaurant-outline' },
  { id: 't10', name: 'Gaming', icon: 'game-controller-outline' },
  { id: 't11', name: 'Tech', icon: 'laptop-outline' },
  { id: 't12', name: 'Fashion', icon: 'shirt-outline' },
  { id: 't13', name: 'Beauty', icon: 'rose-outline' },
  { id: 't14', name: 'Fitness', icon: 'barbell-outline' },
  { id: 't15', name: 'Education', icon: 'school-outline' },
  { id: 't16', name: 'Business', icon: 'briefcase-outline' },
  { id: 't17', name: 'Comedy', icon: 'happy-outline' },
  { id: 't18', name: 'Pets', icon: 'paw-outline' },
  { id: 't19', name: 'DIY', icon: 'hammer-outline' },
  { id: 't20', name: 'Science', icon: 'flask-outline' },
];

const mockAudio = [
  { id: 'a1', title: 'Perfect lady', subtitle: 'Bookcase', thumbnail: 'https://example.com/audio1.jpg' },
  { id: 'a2', title: 'Experience', subtitle: 'Lifestyle', thumbnail: 'https://example.com/audio2.jpg' },
  { id: 'a3', title: 'Yourself', subtitle: 'Bookcase', thumbnail: 'https://example.com/audio3.jpg' },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // Audio player state
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  
  const player = useAudioPlayer(currentAudioUrl || undefined);
  const status = useAudioPlayerStatus(player);
  
  const handleAudioPress = (audio: typeof mockAudios[0]) => {
    if (currentAudioId === audio.id && status.playing) {
      // Pause current audio
      player.pause();
      setCurrentAudioId(null);
    } else if (currentAudioId === audio.id && !status.playing) {
      // Resume
      player.play();
    } else {
      // Play new audio
      setCurrentAudioId(audio.id);
      setCurrentAudioUrl(audio.audioUrl);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="play-circle" size={26} color="#FF2442" />
          <Text style={styles.headerText}>Video Sharing App</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. Stories */}
        <StoryList stories={mockStories} onStoryPress={(s) => console.log(s.name)} />

        {/* 2. Top Trending */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top trending</Text>
          <TouchableOpacity onPress={() => navigation.navigate('VideoList', { 
            title: 'Top trending', 
            type: 'trending' 
          })}>
            <Text style={styles.viewMore}>View more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={mockTrending}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => <VideoCard item={item} onPress={() => navigation.navigate('ReelDetail', { videoId: item.id })} type="trending" />}
        />

        {/* 3. Browse Topics (Đầy đủ 8 mục) */}
        <BrowseTopics topics={mockTopics} onTopicPress={(topic) => {
          // Navigate to specific topic
          navigation.navigate('VideoList', { 
            title: topic.name, 
            type: 'topic',
            topicId: topic.id
          });
        }} />

        {/* 4. Audio */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Audio</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AudioList')}>
            <Text style={styles.viewMore}>View more</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={mockAudios.slice(0, 3)}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <AudioCard
              id={item.id}
              title={item.title}
              artist={item.artist}
              thumbnail={item.thumbnail}
              isPlaying={currentAudioId === item.id && status.playing}
              onPress={() => handleAudioPress(item)}
            />
          )}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Nền trắng toàn tập
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewMore: {
    color: '#FF2442',
    fontSize: 14,
    fontWeight: '500',
  },
  audioList: {
    backgroundColor: '#FFFFFF',
  },
});