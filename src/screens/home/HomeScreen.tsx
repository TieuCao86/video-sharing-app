import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StoryList } from '../../components/cards/StoryList';
import { BrowseTopics } from '../../components/cards/BrowseTopics';
import { VideoCard } from '../../components/cards/VideoCard';
import { AudioCard } from '../../components/AudioCard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

// Import Services trực tiếp từ Supabase
import {
  getTrendingVideos,
  getTopics,
  getAudioTracks,
  VideoDetailItem,
  Topic,
  AudioTrackItem,
} from '../../services';

// Dữ liệu Story avatar giả định cho thanh ngang
const mockStories = [
  { id: '1', name: 'You', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', hasStory: true },
  { id: '2', name: 'Laura', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', hasStory: true },
  { id: '3', name: 'William', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', hasStory: true },
  { id: '4', name: 'Julia', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100', hasStory: true },
  { id: '5', name: 'Peter', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100', hasStory: true },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  // State dữ liệu từ Supabase
  const [trendingVideos, setTrendingVideos] = useState<VideoDetailItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [audios, setAudios] = useState<AudioTrackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Audio player state
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  const player = useAudioPlayer(currentAudioUrl || undefined);
  const status = useAudioPlayerStatus(player);

  const fetchHomeData = useCallback(async () => {
    try {
      const [fetchedVideos, fetchedTopics, fetchedAudios] = await Promise.all([
        getTrendingVideos(10),
        getTopics(),
        getAudioTracks(5),
      ]);
      setTrendingVideos(fetchedVideos);
      setTopics(fetchedTopics);
      setAudios(fetchedAudios);
    } catch (err) {
      console.error('Error fetching home data from Supabase:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHomeData();
  };

  const handleAudioPress = (audio: AudioTrackItem) => {
    if (currentAudioId === audio.id && status.playing) {
      player.pause();
      setCurrentAudioId(null);
    } else if (currentAudioId === audio.id && !status.playing) {
      player.play();
    } else {
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

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF2442" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF2442']} />
          }
        >
          {/* 1. Stories */}
          <StoryList stories={mockStories} onStoryPress={(s) => console.log(s.name)} />

          {/* 2. Top Trending */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top trending</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('VideoList', {
                  title: 'Top trending',
                  type: 'trending',
                })
              }
            >
              <Text style={styles.viewMore}>View more</Text>
            </TouchableOpacity>
          </View>

          {trendingVideos.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có video thịnh hành.</Text>
          ) : (
            <FlatList
              horizontal
              data={trendingVideos}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <VideoCard
                  item={{
                    id: item.id,
                    title: item.title,
                    coverUrl: item.coverUrl,
                    thumbnail: item.coverUrl,
                    views: item.views,
                  }}
                  onPress={() => navigation.navigate('ReelDetail', { videoId: item.id })}
                  type="trending"
                />
              )}
            />
          )}

          {/* 3. Browse Topics (Lấy từ Supabase) */}
          <BrowseTopics
            topics={topics}
            onTopicPress={(topic) => {
              navigation.navigate('VideoList', {
                title: topic.name,
                type: 'topic',
                topicId: topic.id,
              });
            }}
          />

          {/* 4. Audio (Lấy từ Supabase) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Audio</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AudioList')}>
              <Text style={styles.viewMore}>View more</Text>
            </TouchableOpacity>
          </View>

          {audios.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có bài nhạc nào.</Text>
          ) : (
            <FlatList
              horizontal
              data={audios}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={({ item }) => (
                <AudioCard
                  id={item.id}
                  title={item.title}
                  artist={item.artist}
                  thumbnail={item.thumbnailUrl}
                  isPlaying={currentAudioId === item.id && status.playing}
                  onPress={() => handleAudioPress(item)}
                />
              )}
            />
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyText: {
    color: '#888888',
    paddingHorizontal: 16,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
