import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type SortOption = 'latest' | 'popular' | 'views';

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  timeAgo: string;
  creator: {
    name: string;
    avatar: string;
  };
}

// Mock data
const mockVideos: VideoItem[] = [
  {
    id: '1',
    title: 'Amazing sunset timelapse',
    thumbnail: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500',
    views: '1.5M',
    likes: '12.3K',
    timeAgo: '1 min ago',
    creator: {
      name: 'Laura',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    },
  },
  {
    id: '2',
    title: 'Travel vlog - Paris adventure',
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500',
    views: '982K',
    likes: '19.6K',
    timeAgo: '15 min ago',
    creator: {
      name: 'William',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    },
  },
  {
    id: '3',
    title: 'Cute cat playing with toy',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
    views: '2.1M',
    likes: '24.3K',
    timeAgo: '1 hour ago',
    creator: {
      name: 'Julia',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    },
  },
  {
    id: '4',
    title: 'How to cook perfect pasta',
    thumbnail: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=500',
    views: '756K',
    likes: '8.9K',
    timeAgo: '2 hours ago',
    creator: {
      name: 'Peter',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
    },
  },
  {
    id: '5',
    title: 'Epic mountain climbing',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500',
    views: '1.8M',
    likes: '32.1K',
    timeAgo: '3 hours ago',
    creator: {
      name: 'Adam',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    },
  },
  {
    id: '6',
    title: 'Dance performance highlights',
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500',
    views: '1.2M',
    likes: '15.7K',
    timeAgo: '5 hours ago',
    creator: {
      name: 'Liz',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    },
  },
];

type RouteParams = {
  VideoList: {
    title: string; // "Top Trending" or "Sports" etc
    type: 'trending' | 'topic';
    topicId?: string;
  };
};

export const VideoListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'VideoList'>>();
  
  const { title, type } = route.params || { title: 'Videos', type: 'trending' };
  
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { width } = useWindowDimensions();
  const PADDING_HORIZONTAL = 12;
  const COLUMN_GAP = 8;
  const cardWidth = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'latest', label: 'Latest' },
    { value: 'popular', label: 'Most popular' },
    { value: 'views', label: 'Most viewed' },
  ];

  const handleVideoPress = (videoId: string) => {
    navigation.navigate('ReelDetail', { videoId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{title}</Text>

        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Ionicons name="funnel-outline" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy(option.value);
                setShowSortMenu(false);
              }}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.value && styles.sortOptionTextActive
              ]}>
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={20} color="#FF2442" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Current Sort Display */}
      <View style={styles.sortInfoBar}>
        <Text style={styles.sortInfoText}>
          Sorted by: <Text style={styles.sortInfoValue}>
            {sortOptions.find(opt => opt.value === sortBy)?.label}
          </Text>
        </Text>
      </View>

      {/* Video Grid */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={[styles.gridContainer, { paddingHorizontal: PADDING_HORIZONTAL }]}>
          {mockVideos.map((item, index) => {
            const isLeftColumn = index % 2 === 0;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.videoCard,
                  {
                    width: cardWidth,
                    marginRight: isLeftColumn ? COLUMN_GAP : 0,
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => handleVideoPress(item.id)}
              >
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                  <Image 
                    source={{ uri: item.thumbnail }} 
                    style={styles.thumbnail}
                  />
                  
                  {/* Stats Overlay */}
                  <View style={styles.statsOverlay}>
                    <View style={styles.statItem}>
                      <Ionicons name="play" size={12} color="#FFFFFF" />
                      <Text style={styles.statText}>{item.views}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="heart" size={12} color="#FFFFFF" />
                      <Text style={styles.statText}>{item.likes}</Text>
                    </View>
                  </View>

                  {/* Time badge */}
                  {item.timeAgo && (
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>{item.timeAgo}</Text>
                    </View>
                  )}
                </View>

                {/* Title */}
                <Text numberOfLines={2} style={styles.videoTitle}>
                  {item.title}
                </Text>

                {/* Creator Info */}
                <View style={styles.creatorRow}>
                  <Image 
                    source={{ uri: item.creator.avatar }} 
                    style={styles.creatorAvatar}
                  />
                  <Text style={styles.creatorName} numberOfLines={1}>
                    {item.creator.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Load More Button */}
        <TouchableOpacity style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Load more</Text>
          <Ionicons name="chevron-down" size={16} color="#FF2442" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
  sortButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sort Menu
  sortMenu: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionActive: {
    backgroundColor: '#FFF5F7',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#FF2442',
    fontWeight: '600',
  },

  // Sort Info Bar
  sortInfoBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  sortInfoText: {
    fontSize: 13,
    color: '#666666',
  },
  sortInfoValue: {
    fontWeight: '600',
    color: '#000000',
  },

  // Video Grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
    rowGap: 16,
  },
  videoCard: {
    marginBottom: 4,
  },
  thumbnailContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Stats Overlay
  statsOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  // Time Badge
  timeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF2442',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },

  // Video Info
  videoTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333333',
    marginTop: 8,
    lineHeight: 18,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  creatorName: {
    flex: 1,
    fontSize: 12,
    color: '#777777',
    fontWeight: '400',
  },

  // Load More
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
    gap: 4,
  },
  loadMoreText: {
    color: '#FF2442',
    fontSize: 14,
    fontWeight: '600',
  },
});
