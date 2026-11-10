import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { getAudioTracks, searchAudioTracks, AudioTrackItem } from '../../services/audioService';

export const AudioListScreen: React.FC = () => {
  const navigation = useNavigation();
  const [tracks, setTracks] = useState<AudioTrackItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Audio player state
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  const player = useAudioPlayer(currentAudioUrl || undefined);
  const status = useAudioPlayerStatus(player);

  const fetchTracks = useCallback(async (query: string = '') => {
    try {
      if (query.trim()) {
        const results = await searchAudioTracks(query.trim());
        setTracks(results);
      } else {
        const results = await getAudioTracks(50);
        setTracks(results);
      }
    } catch (error) {
      console.error('Error loading audio tracks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsSearching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  // Debounce search
  useEffect(() => {
    if (!searchQuery) {
      fetchTracks('');
      return;
    }
    setIsSearching(true);
    const handler = setTimeout(() => {
      fetchTracks(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery, fetchTracks]);

  // Stop playback when leaving screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (status.playing) {
        player.pause();
      }
    });
    return unsubscribe;
  }, [navigation, player, status.playing]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTracks(searchQuery);
  };

  const handleBack = () => {
    if (status.playing) {
      player.pause();
    }
    navigation.goBack();
  };

  const handlePlayAudio = (audio: AudioTrackItem) => {
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

  const renderAudioItem = ({ item }: { item: AudioTrackItem }) => {
    const isPlaying = currentAudioId === item.id && status.playing;

    return (
      <View style={styles.audioItem}>
        <View style={styles.audioItemContent}>
          {/* Thumbnail with Play / Pause button */}
          <View style={styles.thumbnailWrapper}>
            <Image
              source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/150' }}
              style={styles.thumbnailImage}
            />
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => handlePlayAudio(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* Info */}
          <View style={styles.infoWrapper}>
            <Text style={styles.audioTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.audioArtist} numberOfLines={1}>
              {item.artist}
            </Text>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={13} color="#888888" style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.durationFormatted}</Text>
              <Text style={styles.metaDivider}>•</Text>
              <Ionicons name="musical-notes-outline" size={13} color="#888888" style={{ marginRight: 4 }} />
              <Text style={styles.metaText}>{item.usesCount} videos</Text>
            </View>
          </View>

          {/* Use Sound / Bookmark icon */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Action when user clicks use/info
            }}
          >
            <Ionicons name="bookmark-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>All Audio</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm bài hát, ca sĩ..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#999999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF2442" />
        </View>
      ) : (
        <FlatList
          data={tracks}
          renderItem={renderAudioItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF2442']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={54} color="#CCCCCC" />
              <Text style={styles.emptyText}>
                {isSearching
                  ? 'Đang tìm kiếm...'
                  : searchQuery
                  ? `Không tìm thấy bài hát nào cho "${searchQuery}"`
                  : 'Chưa có bài hát nào'}
              </Text>
            </View>
          }
        />
      )}
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
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  audioItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  audioItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#EAEAEA',
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
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoWrapper: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 3,
  },
  audioArtist: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#888888',
  },
  metaDivider: {
    fontSize: 12,
    color: '#AAAAAA',
    marginHorizontal: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});
