import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StoryList } from '../../components/cards/StoryList';
import { BrowseTopics } from '../../components/cards/BrowseTopics';
import { VideoCard } from '../../components/cards/VideoCard';
import { AudioCard } from '../../components/cards/AudioCard';
import { Ionicons } from '@expo/vector-icons';
import { Story, TopTrendingItem, BrowseTopic } from '../../types/video.type';

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
  { id: 'v1', title: 'Lovely', views: '1.5M views', thumbnail: 'https://example.com/thumb1.jpg', timeAgo: '1 min ago', creator: { id: 'u1', name: 'Laura', avatar: '' } },
  { id: 'v2', title: 'Sweet', views: '1.2M views', thumbnail: 'https://example.com/thumb2.jpg', timeAgo: '45 min ago', creator: { id: 'u2', name: 'Lauren', avatar: '' } },
  { id: 'v3', title: 'Explore', views: '1.8M views', thumbnail: 'https://example.com/thumb3.jpg', timeAgo: '45 min', creator: { id: 'u3', name: 'Kiran', avatar: '' } },
];

const mockTopics: BrowseTopic[] = [
  { id: 't1', name: 'Sports', icon: 'bicycle-outline' },
  { id: 't2', name: 'Podcasts', icon: 'mic-outline' },
  { id: 't3', name: 'News', icon: 'document-text-outline' },
  { id: 't4', name: 'Travel', icon: 'globe-outline' },
  { id: 't5', name: 'Health', icon: 'heart-outline' },
  { id: 't6', name: 'Weather', icon: 'locate-outline' },
  { id: 't7', name: 'Art', icon: 'image-outline' },
  { id: 't8', name: '+20 Topics', icon: 'add-circle-outline' },
];

const mockStreaming: TopTrendingItem[] = [
  { id: 's1', title: 'Lifestyle', views: '1.5M views', thumbnail: 'https://example.com/stream1.jpg', timeAgo: '1 min ago', creator: { id: 'u4', name: 'Jane', avatar: '' } },
  { id: 's2', title: 'Cooking', views: '1.3M views', thumbnail: 'https://example.com/stream2.jpg', timeAgo: '45 min ago', creator: { id: 'u5', name: 'Lauren', avatar: '' } },
  { id: 's3', title: 'Dancing', views: '2M views', thumbnail: 'https://example.com/stream3.jpg', timeAgo: '45 min', creator: { id: 'u6', name: 'Alice', avatar: '' } },
];

const mockAudio = [
  { id: 'a1', title: 'Perfect lady', subtitle: 'Bookcase', thumbnail: 'https://example.com/audio1.jpg' },
  { id: 'a2', title: 'Experience', subtitle: 'Lifestyle', thumbnail: 'https://example.com/audio2.jpg' },
  { id: 'a3', title: 'Yourself', subtitle: 'Bookcase', thumbnail: 'https://example.com/audio3.jpg' },
];

export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="play-circle" size={26} color="#FF2442" />
          <Text style={styles.headerText}>Video Sharing App</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 1. Stories */}
        <StoryList stories={mockStories} onStoryPress={(s) => console.log(s.name)} />

        {/* 2. Top Trending */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top trending</Text>
          <TouchableOpacity><Text style={styles.viewMore}>View more</Text></TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={mockTrending}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => <VideoCard item={item} onPress={() => {}} type="trending" />}
        />

        {/* 3. Browse Topics (Đầy đủ 8 mục) */}
        <BrowseTopics topics={mockTopics} onTopicPress={(t) => console.log(t.name)} />

        {/* 4. Streaming */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Streaming</Text>
          <TouchableOpacity><Text style={styles.viewMore}>View more</Text></TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={mockStreaming}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => <VideoCard item={item} onPress={() => {}} type="trending" />}
        />

        {/* 5. Audio */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Audio</Text>
          <TouchableOpacity><Text style={styles.viewMore}>View more</Text></TouchableOpacity>
        </View>
        <FlatList
          horizontal
          data={mockAudio}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => <AudioCard item={item} onPress={() => {}} />}
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
});