import React, { useState } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  useWindowDimensions // Sử dụng hook này để responsive theo kích thước màn hình thiết bị
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Dữ liệu mẫu kết quả tìm kiếm
const mockSearchResults = [
  {
    id: '1',
    thumbnail: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500',
    views: '1.5M views',
    likes: '12.3K',
    caption: 'Eiusmod Lorem aliquip exercitation',
    creatorName: 'Laura',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
  },
  {
    id: '2',
    thumbnail: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500',
    views: '12.4K views',
    likes: '19.6K',
    caption: 'Reprehenderit ad fugiat nulla mollit',
    creatorName: 'Liz',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
    timeAgo: '1 min ago',
  },
  {
    id: '3',
    thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=500',
    views: '1.5M views',
    likes: '24.3K',
    caption: 'Consectetur est aliquip adipisicing',
    creatorName: 'Cris',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100',
  },
  {
    id: '4',
    thumbnail: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=500',
    views: '1.5M views',
    likes: '29.7K',
    caption: 'Aute adipisicing ea in nostrud sunt',
    creatorName: 'Lina',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  },
];

const mockTags = [
  'Funny momments of pet',
  'Cats',
  'Dogs',
  'Foods for pet',
  'Vet center',
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const [searchText, setSearchText] = useState('Pet');
  const [activeTab, setActiveTab] = useState('Trending');
  const tabs = ['Trending', 'Accounts', 'Streaming', 'Audio'];

  // Lấy width động theo khung hình hiện tại của thiết bị đang giả lập
  const { width } = useWindowDimensions();

  // Thiết lập lề và khoảng cách giữa 2 cột sát nhau chuẩn mẫu
  const PADDING_HORIZONTAL = 12;
  const COLUMN_GAP = 8; 
  const cardWidth = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Thanh tìm kiếm */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search..."
            placeholderTextColor="#999"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={22} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 2. Sub-tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tabContainer}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3. Lưới hiển thị kết quả video (2 cột sát nhau) */}
        <View style={[styles.gridContainer, { paddingHorizontal: PADDING_HORIZONTAL }]}>
          {mockSearchResults.map((item, index) => {
            const isLeftColumn = index % 2 === 0;
            return (
              <TouchableOpacity 
                key={item.id} 
                style={[
                  styles.videoCard, 
                  { 
                    width: cardWidth, 
                    marginRight: isLeftColumn ? COLUMN_GAP : 0 
                  }
                ]} 
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ReelDetail', { videoId: item.id })}
              >
                <View style={styles.thumbnailContainer}>
                  <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                  
                  {item.timeAgo && (
                    <View style={styles.badge}>
                      <View style={styles.badgeDot} />
                      <Text style={styles.badgeText}>{item.timeAgo}</Text>
                    </View>
                  )}

                  <View style={styles.statsOverlay}>
                    <Text style={styles.statsText}>▶ {item.views}</Text>
                    <Text style={styles.statsText}>♡ {item.likes}</Text>
                  </View>
                </View>

                <Text numberOfLines={2} style={styles.caption}>
                  {item.caption}
                </Text>

                <View style={styles.creatorRow}>
                  <Image source={{ uri: item.creatorAvatar }} style={styles.avatar} />
                  <Text style={styles.creatorName}>{item.creatorName}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Nút Show more */}
        <TouchableOpacity style={styles.showMoreButton}>
          <Text style={styles.showMoreText}>Show more</Text>
          <Ionicons name="chevron-down" size={16} color="#FF2D55" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* 4. Phần "Maybe you're interested" */}
        <View style={[styles.interestedSection, { paddingHorizontal: PADDING_HORIZONTAL }]}>
          <Text style={styles.interestedTitle}>{"Maybe you're interested"}</Text>
          <View style={styles.tagsGrid}>
            {mockTags.map((tag, idx) => (
              <TouchableOpacity key={idx} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  clearIcon: {
    padding: 2,
  },
  filterButton: {
    padding: 4,
  },
  tabContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeTabItem: {
    backgroundColor: '#FF2D55',
  },
  tabText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', // Không dùng space-between để tránh khoảng trống lớn giữa 2 cột
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
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF2D55',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  caption: {
    fontSize: 13,
    color: '#333333',
    marginTop: 8,
    lineHeight: 18,
    fontWeight: '400',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 6,
  },
  creatorName: {
    fontSize: 12,
    color: '#777777',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  showMoreText: {
    color: '#FF2D55',
    fontSize: 14,
    fontWeight: '500',
  },
  interestedSection: {
    marginTop: 8,
  },
  interestedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tagText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '500',
  },
});