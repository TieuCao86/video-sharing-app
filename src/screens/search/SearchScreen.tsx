import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  useWindowDimensions,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import {
  mockSearchVideos,
  mockSearchAccounts,
  mockSearchStreams,
  mockSearchAudios,
  mockTrendingTags,
  defaultRecentSearches,
  SearchVideoItem,
  SearchAccountItem,
  SearchStreamItem,
  SearchAudioItem,
} from './searchData';
import { SearchFilterModal, FilterState } from './SearchFilterModal';

const RECENT_SEARCHES_KEY = '@video_app_search_history';
const INITIAL_PAGE_SIZE = 6;

type TabType = 'Trending' | 'Accounts' | 'Streaming' | 'Audio';
const TABS: TabType[] = ['Trending', 'Accounts', 'Streaming', 'Audio'];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Search input state
  const [searchText, setSearchText] = useState(route.params?.query || '');
  const [debouncedSearchText, setDebouncedSearchText] = useState(route.params?.query || '');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('Trending');

  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'relevance',
    dateOption: 'all',
  });

  // Pagination for videos
  const [displayCount, setDisplayCount] = useState(INITIAL_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Accounts following state
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    new Set(mockSearchAccounts.filter((a) => a.isFollowing).map((a) => a.id))
  );

  // Audio player state
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const player = useAudioPlayer(currentAudioUrl || undefined);
  const audioStatus = useAudioPlayerStatus(player);


  // Window dimension for dynamic 2-column layout
  const { width } = useWindowDimensions();
  const PADDING_HORIZONTAL = 14;
  const COLUMN_GAP = 10;
  const cardWidth = (width - PADDING_HORIZONTAL * 2 - COLUMN_GAP) / 2;

  // 1. Load recent searches from AsyncStorage
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentSearches(parsed);
            return;
          }
        }
        setRecentSearches(defaultRecentSearches);
      } catch {
        setRecentSearches(defaultRecentSearches);
      }
    };
    loadHistory();
  }, []);

  // Save query to history
  const saveSearchQuery = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
        const updated = [trimmed, ...filtered].slice(0, 10);
        AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Remove single search item
  const handleRemoveHistoryItem = useCallback(async (itemToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // Clear all recent searches
  const handleClearAllHistory = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  }, []);

  // 2. Debounce search input
  useEffect(() => {
    if (searchText.trim() === '') {
      setDebouncedSearchText('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Reset pagination when search query or tab or filters change
  useEffect(() => {
    setDisplayCount(INITIAL_PAGE_SIZE);
  }, [debouncedSearchText, activeTab, filters]);

  // Stop audio on tab change
  useEffect(() => {
    if (activeTab !== 'Audio' && audioStatus.playing) {
      player.pause();
      setCurrentAudioId(null);
    }
  }, [activeTab, audioStatus.playing, player]);

  // Audio play/pause handler
  const handleAudioPress = (audio: SearchAudioItem) => {
    if (currentAudioId === audio.id && audioStatus.playing) {
      player.pause();
      setCurrentAudioId(null);
    } else if (currentAudioId === audio.id && !audioStatus.playing) {
      player.play();
    } else {
      setCurrentAudioId(audio.id);
      setCurrentAudioUrl(audio.audioUrl);
    }
  };

  // Toggle follow user
  const handleToggleFollow = (userId: string) => {
    setFollowedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Handle Tag click
  const handleTagPress = (tag: string) => {
    setSearchText(tag);
    saveSearchQuery(tag);
    Keyboard.dismiss();
  };

  // Handle search submit from keyboard
  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      saveSearchQuery(searchText);
    }
    Keyboard.dismiss();
  };

  // Show more pagination handler
  const handleShowMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + 4);
      setIsLoadingMore(false);
    }, 400);
  };

  // Check if any non-default filter is active
  const hasActiveFilter = filters.sortBy !== 'relevance' || filters.dateOption !== 'all';

  // 3. Filtered & Sorted Videos
  const filteredVideos = useMemo((): SearchVideoItem[] => {
    const query = debouncedSearchText.trim().toLowerCase();
    let list = mockSearchVideos;

    if (query) {
      list = list.filter(
        (item) =>
          item.caption.toLowerCase().includes(query) ||
          item.creatorName.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (filters.dateOption === 'today') {
      list = list.filter((item) => nowMs - item.timestamp <= oneDayMs);
    } else if (filters.dateOption === 'week') {
      list = list.filter((item) => nowMs - item.timestamp <= 7 * oneDayMs);
    } else if (filters.dateOption === 'month') {
      list = list.filter((item) => nowMs - item.timestamp <= 30 * oneDayMs);
    }

    // Apply sort filter
    const sorted = [...list];
    if (filters.sortBy === 'views') {
      sorted.sort((a, b) => b.viewsCount - a.viewsCount);
    } else if (filters.sortBy === 'likes') {
      sorted.sort((a, b) => b.likesCount - a.likesCount);
    } else if (filters.sortBy === 'latest') {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    }

    return sorted;
  }, [debouncedSearchText, filters]);

  // 4. Filtered Accounts
  const filteredAccounts = useMemo((): SearchAccountItem[] => {
    const query = debouncedSearchText.trim().toLowerCase();
    if (!query) return mockSearchAccounts;

    return mockSearchAccounts.filter(
      (acc) =>
        acc.name.toLowerCase().includes(query) ||
        acc.username.toLowerCase().includes(query) ||
        acc.bio.toLowerCase().includes(query)
    );
  }, [debouncedSearchText]);

  // 5. Filtered Live Streams
  const filteredStreams = useMemo((): SearchStreamItem[] => {
    const query = debouncedSearchText.trim().toLowerCase();
    if (!query) return mockSearchStreams;

    return mockSearchStreams.filter(
      (str) =>
        str.title.toLowerCase().includes(query) ||
        str.streamerName.toLowerCase().includes(query) ||
        str.category.toLowerCase().includes(query) ||
        str.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [debouncedSearchText]);

  // 6. Filtered Audio
  const filteredAudios = useMemo((): SearchAudioItem[] => {
    const query = debouncedSearchText.trim().toLowerCase();
    if (!query) return mockSearchAudios;

    return mockSearchAudios.filter(
      (aud) =>
        aud.title.toLowerCase().includes(query) ||
        aud.artist.toLowerCase().includes(query)
    );
  }, [debouncedSearchText]);

  // Render Video Item (Grid Card)
  const renderVideoCard = (item: SearchVideoItem, index: number) => {
    const isLeftColumn = index % 2 === 0;
    return (
      <TouchableOpacity 
        key={item.id} 
        style={[styles.videoCard, { width: cardWidth, marginRight: isLeftColumn ? COLUMN_GAP : 0 }]} 
        activeOpacity={0.88}
        onPress={() => {
          saveSearchQuery(item.creatorName);
          navigation.navigate('ReelDetail', { videoId: item.id });
        }}
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
          <Text numberOfLines={1} style={styles.creatorName}>{item.creatorName}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Account Item
  const renderAccountItem = (account: SearchAccountItem) => {
    const isFollowing = followedIds.has(account.id);
    return (
      <View key={account.id} style={styles.accountRow}>
        <Image source={{ uri: account.avatar }} style={styles.accountAvatar} />
        
        <View style={styles.accountInfo}>
          <View style={styles.accountNameRow}>
            <Text style={styles.accountName}>{account.name}</Text>
            {account.isVerified && (
              <Ionicons name="checkmark-circle" size={15} color="#0095F6" style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.accountUsername}>{account.username}</Text>
          <Text numberOfLines={1} style={styles.accountBio}>{account.bio}</Text>
          <Text style={styles.accountMeta}>
            <Text style={styles.accountMetaBold}>{account.followers}</Text> followers ·{' '}
            <Text style={styles.accountMetaBold}>{account.videosCount}</Text> videos
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={() => handleToggleFollow(account.id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render Streaming Item
  const renderStreamItem = (stream: SearchStreamItem) => {
    return (
      <TouchableOpacity
        key={stream.id}
        style={styles.streamCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ReelDetail', { videoId: stream.id })}
      >
        <View style={styles.streamThumbnailContainer}>
          <Image source={{ uri: stream.thumbnail }} style={styles.streamThumbnail} />
          <View style={styles.liveBadge}>
            <View style={styles.livePulseDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <View style={styles.streamViewerBadge}>
            <Ionicons name="eye" size={12} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.streamViewerText}>{stream.viewers}</Text>
          </View>
        </View>

        <View style={styles.streamDetails}>
          <View style={styles.streamerRow}>
            <Image source={{ uri: stream.streamerAvatar }} style={styles.streamerAvatar} />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.streamTitle}>{stream.title}</Text>
              <Text style={styles.streamerName}>{stream.streamerName} · {stream.category}</Text>
            </View>
          </View>
          <View style={styles.streamTagsRow}>
            {stream.tags.map((tag, i) => (
              <View key={i} style={styles.streamTagPill}>
                <Text style={styles.streamTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Audio Item
  const renderAudioItem = (audio: SearchAudioItem) => {
    const isPlaying = currentAudioId === audio.id && audioStatus.playing;
    return (
      <View key={audio.id} style={styles.audioRow}>
        <View style={styles.audioThumbWrapper}>
          <Image source={{ uri: audio.thumbnail }} style={styles.audioThumb} />
          <TouchableOpacity
            style={styles.audioPlayOverlay}
            onPress={() => handleAudioPress(audio)}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.audioInfo}>
          <Text numberOfLines={1} style={styles.audioTitle}>{audio.title}</Text>
          <Text numberOfLines={1} style={styles.audioArtist}>{audio.artist}</Text>
          <View style={styles.audioMetaRow}>
            <Ionicons name="time-outline" size={12} color="#888" style={{ marginRight: 3 }} />
            <Text style={styles.audioMetaText}>{audio.duration}</Text>
            <Text style={styles.audioMetaDivider}>·</Text>
            <Ionicons name="musical-notes-outline" size={12} color="#888" style={{ marginRight: 3 }} />
            <Text style={styles.audioMetaText}>{audio.usesCount}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.audioUseBtn}
          onPress={() => navigation.navigate('AudioList')}
          activeOpacity={0.8}
        >
          <Ionicons name="bookmark-outline" size={18} color="#FF2D55" />
        </TouchableOpacity>
      </View>
    );
  };

  // Determine if there are active search results to show
  const showInitialDiscovery = debouncedSearchText.trim() === '';

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Search Header Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#999999" style={styles.searchLeadingIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search videos, creators, sounds..."
            placeholderTextColor="#999999"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            autoCapitalize="none"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearIcon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#999999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={hasActiveFilter ? 'options' : 'options-outline'} 
            size={22} 
            color={hasActiveFilter ? '#FF2D55' : '#333333'} 
          />
          {hasActiveFilter && <View style={styles.filterActiveBadge} />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* If user hasn't typed anything yet: Show Search History & Popular Topics */}
        {showInitialDiscovery ? (
          <View style={styles.discoveryContainer}>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.sectionWrapper}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeading}>Recent searches</Text>
                  <TouchableOpacity onPress={handleClearAllHistory}>
                    <Text style={styles.clearAllText}>Clear all</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.recentChipsContainer}>
                  {recentSearches.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.recentChip}
                      onPress={() => handleTagPress(item)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="time-outline" size={14} color="#777777" style={{ marginRight: 6 }} />
                      <Text style={styles.recentChipText}>{item}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveHistoryItem(item)}
                        style={styles.removeChipBtn}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="close" size={14} color="#999999" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Trending Hot Topics */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Trending topics</Text>
                <Ionicons name="flame" size={18} color="#FF2D55" />
              </View>
              <View style={styles.tagsGrid}>
                {mockTrendingTags.map((tag, idx) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={styles.tagPill}
                    onPress={() => handleTagPress(tag)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.tagHash}>#</Text>
                    <Text style={styles.tagText}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Suggested Categories */}
            <View style={[styles.sectionWrapper, { marginTop: 10 }]}>
              <Text style={styles.sectionHeading}>Browse categories</Text>
              <View style={styles.categoryGrid}>
                {[
                  { label: 'Pets & Animals', icon: 'paw', color: '#FF6B6B' },
                  { label: 'Music & Dance', icon: 'musical-notes', color: '#4ECDC4' },
                  { label: 'Food & Cooking', icon: 'restaurant', color: '#FFA07A' },
                  { label: 'Fitness & Health', icon: 'barbell', color: '#45B649' },
                ].map((cat, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.categoryCard}
                    onPress={() => handleTagPress(cat.label)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.categoryIconCircle, { backgroundColor: cat.color }]}>
                      <Ionicons name={cat.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* When searching with query: Show Tab bar and filtered results */
          <>
            {/* 2. Sub-tabs */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.tabContainer}
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tabItem, isActive && styles.activeTabItem]}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Results based on tab */}
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF2D55" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : (
              <View style={{ minHeight: 300 }}>
                {/* TAB 1: TRENDING (VIDEOS) */}
                {activeTab === 'Trending' && (
                  <>
                    {filteredVideos.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="videocam-off-outline" size={54} color="#CCCCCC" />
                        <Text style={styles.emptyText}>
                          No videos found for &quot;{debouncedSearchText}&quot;
                        </Text>
                        <Text style={styles.emptySubText}>Try different keywords or reset your filters</Text>
                        {hasActiveFilter && (
                          <TouchableOpacity 
                            style={styles.resetFilterButton}
                            onPress={() => setFilters({ sortBy: 'relevance', dateOption: 'all' })}
                          >
                            <Text style={styles.resetFilterButtonText}>Reset Filters</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <>
                        <View style={[styles.gridContainer, { paddingHorizontal: PADDING_HORIZONTAL }]}>
                          {filteredVideos.slice(0, displayCount).map((item, index) => renderVideoCard(item, index))}
                        </View>

                        {/* Show More Button */}
                        {filteredVideos.length > displayCount ? (
                          <TouchableOpacity 
                            style={styles.showMoreButton} 
                            onPress={handleShowMore}
                            disabled={isLoadingMore}
                            activeOpacity={0.8}
                          >
                            {isLoadingMore ? (
                              <ActivityIndicator size="small" color="#FF2D55" />
                            ) : (
                              <>
                                <Text style={styles.showMoreText}>Show more</Text>
                                <Ionicons name="chevron-down" size={16} color="#FF2D55" style={{ marginLeft: 4 }} />
                              </>
                            )}
                          </TouchableOpacity>
                        ) : filteredVideos.length > 4 ? (
                          <View style={styles.endOfResultsContainer}>
                            <Text style={styles.endOfResultsText}>You&apos;ve reached the end of results</Text>
                          </View>
                        ) : null}

                        {/* "Maybe you're interested" Section */}
                        <View style={[styles.interestedSection, { paddingHorizontal: PADDING_HORIZONTAL }]}>
                          <Text style={styles.interestedTitle}>Maybe you&apos;re interested</Text>
                          <View style={styles.tagsGrid}>
                            {mockTrendingTags.map((tag, idx) => (
                              <TouchableOpacity 
                                key={idx} 
                                style={styles.tagPill}
                                onPress={() => handleTagPress(tag)}
                                activeOpacity={0.75}
                              >
                                <Text style={styles.tagText}>{tag}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      </>
                    )}
                  </>
                )}

                {/* TAB 2: ACCOUNTS */}
                {activeTab === 'Accounts' && (
                  <View style={styles.tabContentContainer}>
                    {filteredAccounts.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="person-outline" size={54} color="#CCCCCC" />
                        <Text style={styles.emptyText}>
                          No accounts found for &quot;{debouncedSearchText}&quot;
                        </Text>
                        <Text style={styles.emptySubText}>Check your spelling or search for popular creators</Text>
                      </View>
                    ) : (
                      filteredAccounts.map((account) => renderAccountItem(account))
                    )}
                  </View>
                )}

                {/* TAB 3: STREAMING */}
                {activeTab === 'Streaming' && (
                  <View style={styles.tabContentContainer}>
                    {filteredStreams.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="radio-outline" size={54} color="#CCCCCC" />
                        <Text style={styles.emptyText}>
                          No live streams found for &quot;{debouncedSearchText}&quot;
                        </Text>
                        <Text style={styles.emptySubText}>Try searching for popular pet channels or gaming streams</Text>
                      </View>
                    ) : (
                      filteredStreams.map((stream) => renderStreamItem(stream))
                    )}
                  </View>
                )}

                {/* TAB 4: AUDIO */}
                {activeTab === 'Audio' && (
                  <View style={styles.tabContentContainer}>
                    {filteredAudios.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="musical-notes-outline" size={54} color="#CCCCCC" />
                        <Text style={styles.emptyText}>
                          No sounds found for &quot;{debouncedSearchText}&quot;
                        </Text>
                        <Text style={styles.emptySubText}>Try searching by song name or artist</Text>
                      </View>
                    ) : (
                      filteredAudios.map((audio) => renderAudioItem(audio))
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter Modal */}
      <SearchFilterModal
        visible={filterModalVisible}
        currentFilters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApply={(newFilters) => setFilters(newFilters)}
      />
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 42,
    marginRight: 10,
  },
  searchLeadingIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111111',
    paddingVertical: 0,
  },
  clearIcon: {
    padding: 4,
  },
  filterButton: {
    padding: 8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActiveBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF2D55',
  },

  // Discovery / Initial State
  discoveryContainer: {
    paddingHorizontal: 14,
    paddingTop: 16,
  },
  sectionWrapper: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  clearAllText: {
    fontSize: 13,
    color: '#888888',
    fontWeight: '500',
  },
  recentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  recentChipText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
  },
  removeChipBtn: {
    marginLeft: 6,
    padding: 2,
  },

  // Categories
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  categoryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 14,
    padding: 12,
  },
  categoryIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#222222',
    flex: 1,
  },

  // Sub-tabs
  tabContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  activeTabItem: {
    backgroundColor: '#FF2D55',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Grid for Videos
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
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
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    flex: 1,
  },

  // Pagination & Show More
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
    fontWeight: '600',
  },
  endOfResultsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  endOfResultsText: {
    color: '#AAAAAA',
    fontSize: 13,
  },

  // "Maybe you're interested" Section
  interestedSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    paddingTop: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tagHash: {
    color: '#3B82F6',
    fontWeight: '700',
    marginRight: 2,
    fontSize: 13,
  },
  tagText: {
    color: '#3B82F6',
    fontSize: 13,
    fontWeight: '500',
  },

  // Tab Content Common
  tabContentContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },

  // Tab 2: Accounts
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  accountAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  accountInfo: {
    flex: 1,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  accountUsername: {
    fontSize: 13,
    color: '#888888',
    marginTop: 1,
  },
  accountBio: {
    fontSize: 12,
    color: '#555555',
    marginTop: 3,
  },
  accountMeta: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  accountMetaBold: {
    color: '#333333',
    fontWeight: '600',
  },
  followBtn: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    marginLeft: 10,
  },
  followingBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  followingBtnText: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '500',
  },

  // Tab 3: Streaming
  streamCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  streamThumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#EAEAEA',
    position: 'relative',
  },
  streamThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF2D55',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  streamViewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  streamViewerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  streamDetails: {
    padding: 14,
  },
  streamerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  streamTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  streamerName: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  streamTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  streamTagPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streamTagText: {
    fontSize: 12,
    color: '#555555',
    fontWeight: '500',
  },

  // Tab 4: Audio
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  audioThumbWrapper: {
    width: 54,
    height: 54,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 14,
  },
  audioThumb: {
    width: '100%',
    height: '100%',
  },
  audioPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
  audioArtist: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  audioMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  audioMetaText: {
    fontSize: 12,
    color: '#888888',
  },
  audioMetaDivider: {
    marginHorizontal: 6,
    color: '#BBBBBB',
  },
  audioUseBtn: {
    padding: 10,
    backgroundColor: '#FFF0F3',
    borderRadius: 20,
    marginLeft: 10,
  },

  // Loading & Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#444444',
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 6,
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  resetFilterButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
  },
  resetFilterButtonText: {
    color: '#FF2D55',
    fontWeight: '600',
    fontSize: 14,
  },
});
