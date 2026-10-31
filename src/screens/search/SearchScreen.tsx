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
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2; // Tính toán chiều rộng cho 2 cột đều nhau

// Dữ liệu mẫu kết quả tìm kiếm bám sát thiết kế
const mockSearchResults = [
  {
    id: '1',
    thumbnail: 'https://example.com/pet1.jpg',
    views: '1.5M views',
    likes: '12.3K',
    caption: 'Eiusmod Lorem aliquip exercitation',
    creatorName: 'Laura',
    creatorAvatar: 'https://example.com/avatar1.jpg',
  },
  {
    id: '2',
    thumbnail: 'https://example.com/pet2.jpg',
    views: '12.4K views',
    likes: '19.6K',
    caption: 'Reprehenderit ad fugiat nulla mollit',
    creatorName: 'Liz',
    creatorAvatar: 'https://example.com/avatar2.jpg',
    timeAgo: '1 min ago',
  },
  {
    id: '3',
    thumbnail: 'https://example.com/pet3.jpg',
    views: '1.5M views',
    likes: '24.3K',
    caption: 'Consectetur est aliquip adipisicing',
    creatorName: 'Cris',
    creatorAvatar: 'https://example.com/avatar3.jpg',
  },
  {
    id: '4',
    thumbnail: 'https://example.com/pet4.jpg',
    views: '1.5M views',
    likes: '29.7K',
    caption: 'Aute adipisicing ea in nostrud sunt',
    creatorName: 'Lina',
    creatorAvatar: 'https://example.com/avatar4.jpg',
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
  const [searchText, setSearchText] = useState('Pet');
  const [activeTab, setActiveTab] = useState('Trending');

  const tabs = ['Trending', 'Accounts', 'Streaming', 'Audio'];

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Thanh tìm kiếm trên cùng */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search..."
            placeholderTextColor="#888"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearIcon}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 2. Sub-tabs (Trending, Accounts, Streaming, Audio) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
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

        {/* 3. Lưới hiển thị kết quả video (2 cột) */}
        <View style={styles.gridContainer}>
          {mockSearchResults.map((item) => (
            <TouchableOpacity key={item.id} style={styles.videoCard} activeOpacity={0.9}>
              <View style={styles.thumbnailContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                {item.timeAgo && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.timeAgo}</Text>
                  </View>
                )}
                <View style={styles.statsOverlay}>
                  <Text style={styles.statsText}>▶ {item.views}</Text>
                  <Text style={styles.statsText}>❤️ {item.likes}</Text>
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
          ))}
        </View>

        {/* Nút Show more */}
        <TouchableOpacity style={styles.showMoreButton}>
          <Text style={styles.showMoreText}>Show more</Text>
          <Ionicons name="chevron-down" size={16} color="#FF2442" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* 4. Phần "Maybe you're interested" */}
        <View style={styles.interestedSection}>
          <Text style={styles.interestedTitle}>Maybe you're interested</Text>
          <View style={styles.tagsGrid}>
            {mockTags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tagPill}>
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EFEFEF',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  clearIcon: {
    padding: 4,
  },
  filterButton: {
    padding: 4,
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  activeTabItem: {
    backgroundColor: '#FFE5EC', // Hồng nhạt khi active
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF2442', // Chữ đỏ/hồng chủ đạo khi active
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  videoCard: {
    width: cardWidth,
    marginBottom: 16,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EFEFEF',
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
    backgroundColor: 'rgba(255, 36, 66, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
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
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  caption: {
    fontSize: 13,
    color: '#000000',
    marginTop: 6,
    fontWeight: '400',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  creatorName: {
    fontSize: 12,
    color: '#555555',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  showMoreText: {
    color: '#FF2442',
    fontSize: 14,
    fontWeight: '600',
  },
  interestedSection: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  interestedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    backgroundColor: '#F0F5FF', // Nền xanh nhạt cho thẻ tag
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#0066FF',
    fontSize: 13,
    fontWeight: '500',
  },
});