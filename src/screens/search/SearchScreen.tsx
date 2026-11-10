import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

// Services Supabase
import { supabase } from '../../utils/supabase';
import {
  searchVideos,
  getTrendingVideos,
  searchProfiles,
  searchAudioTracks,
  getAudioTracks,
  toggleFollowUser,
  VideoDetailItem,
  UserProfileItem,
  AudioTrackItem,
} from '../../services';
import { useAuthStore } from '../../store/useAuthStore';
import { SearchFilterModal, FilterState } from './SearchFilterModal';

const RECENT_SEARCHES_KEY = '@video_app_search_history';
const INITIAL_PAGE_SIZE = 6;

// Theo SDS: Search S02 chỉ gồm 3 tab: Trending, Accounts, Audio
type TabType = 'Trending' | 'Accounts' | 'Audio';
const TABS: TabType[] = ['Trending', 'Accounts', 'Audio'];

const defaultTrendingTags = [
  'Pets',
  'Cooking',
  'Travel',
  'Sports',
  'Music',
  'Tech',
  'Art',
  'Health',
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, isLoggedIn, checkAuth } = useAuthStore();
  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);

  // Lấy userId thực tế từ Supabase auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user?.id) {
        setCurrentSessionUserId(data.session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentSessionUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Search input state
  const [searchText, setSearchText] = useState(route.params?.query || '');
  const [debouncedSearchText, setDebouncedSearchText] = useState(route.params?.query || '');
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Tab state (Trending, Accounts, Audio)
  const [activeTab, setActiveTab] = useState<TabType>('Trending');

  // Filter state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'relevance',
    dateOption: 'all',
  });

  // Supabase Data states
  const [videos, setVideos] = useState<VideoDetailItem[]>([]);
  const [accounts, setAccounts] = useState<UserProfileItem[]>([]);
  const [audios, setAudios] = useState<AudioTrackItem[]>([]);

  // Pagination for videos
  const [displayCount, setDisplayCount] = useState(INITIAL_PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Followed accounts tracker
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());

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

  // 1. Load recent searches
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
        setRecentSearches(['Sunset', 'Paris', 'Cat', 'Pasta', 'Sports']);
      } catch {
        setRecentSearches(['Sunset', 'Paris', 'Cat', 'Pasta', 'Sports']);
      }
    };
    loadHistory();
  }, []);

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
      // Ignore
    }
  }, []);

  const handleRemoveHistoryItem = useCallback(async (itemToRemove: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== itemToRemove);
      AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const handleClearAllHistory = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => {});
  }, []);

  // 2. Debounce search input
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // 3. FETCH DỮ LIỆU TỪ SUPABASE THEO TỪ KHÓA & TAB
  useEffect(() => {
    let isMounted = true;
    async function executeSearch() {
      setIsSearching(true);
      const query = debouncedSearchText.trim();
      try {
        if (!query) {
          // Khi chưa nhập từ khóa -> Lấy dữ liệu phổ biến ban đầu
          const [trendingVids, popularAudios] = await Promise.all([
            getTrendingVideos(20),
            getAudioTracks(20),
          ]);
          if (isMounted) {
            setVideos(trendingVids);
            setAudios(popularAudios);
          }
        } else {
          // Khi đang tìm kiếm theo query
          if (activeTab === 'Trending') {
            const vids = await searchVideos(query);
            if (isMounted) setVideos(vids);
          } else if (activeTab === 'Accounts') {
            const accs = await searchProfiles(query, user?.id);
            if (isMounted) setAccounts(accs);
          } else if (activeTab === 'Audio') {
            const songs = await searchAudioTracks(query);
            if (isMounted) setAudios(songs);
          }
        }
      } catch (err) {
        console.error('Error executing search on Supabase:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }

    executeSearch();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearchText, activeTab, user?.id]);

  // Dừng phát audio khi chuyển tab
  useEffect(() => {
    if (activeTab !== 'Audio' && audioStatus.playing) {
      player.pause();
      setCurrentAudioId(null);
    }
  }, [activeTab, audioStatus.playing, player]);

  const handleAudioPress = (audio: AudioTrackItem) => {
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

  const handleToggleFollow = (targetId: string) => {
    checkAuth(async () => {
      try {
        const nextState = await toggleFollowUser(user.id, targetId);
        setFollowedIds((prev) => {
          const next = new Set(prev);
          if (nextState) next.add(targetId);
          else next.delete(targetId);
          return next;
        });
      } catch (err) {
        console.error('Follow error:', err);
      }
    });
  };

  const handleTagPress = (tag: string) => {
    setSearchText(tag);
    saveSearchQuery(tag);
    Keyboard.dismiss();
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      saveSearchQuery(searchText);
    }
    Keyboard.dismiss();
  };

  const handleShowMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setDisplayCount((prev) => prev + 4);
      setIsLoadingMore(false);
    }, 300);
  };

  const hasActiveFilter = filters.sortBy !== 'relevance' || filters.dateOption !== 'all';

  // Lọc và sắp xếp kết quả video theo FilterModal
  const filteredVideos = useMemo((): VideoDetailItem[] => {
    let list = [...videos];

    // Lọc theo ngày
    const nowMs = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (filters.dateOption === 'today') {
      list = list.filter((v) => nowMs - new Date(v.createdAt).getTime() <= oneDayMs);
    } else if (filters.dateOption === 'week') {
      list = list.filter((v) => nowMs - new Date(v.createdAt).getTime() <= 7 * oneDayMs);
    } else if (filters.dateOption === 'month') {
      list = list.filter((v) => nowMs - new Date(v.createdAt).getTime() <= 30 * oneDayMs);
    }

    // Sắp xếp
    if (filters.sortBy === 'views') {
      list.sort((a, b) => b.viewsCount - a.viewsCount);
    } else if (filters.sortBy === 'likes') {
      list.sort((a, b) => b.likesCount - a.likesCount);
    } else if (filters.sortBy === 'latest') {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [videos, filters]);

  // Render Video Grid Item
  const renderVideoCard = (item: VideoDetailItem, index: number) => {
    const isLeftColumn = index % 2 === 0;
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.videoCard, { width: cardWidth, marginRight: isLeftColumn ? COLUMN_GAP : 0 }]}
        activeOpacity={0.88}
        onPress={() => {
          saveSearchQuery(item.creator.name);
          navigation.navigate('ReelDetail', { videoId: item.id });
        }}
      >
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: item.coverUrl }} style={styles.thumbnail} />

          <View style={styles.statsOverlay}>
            <Text style={styles.statsText}>▶ {item.views}</Text>
            <Text style={styles.statsText}>♡ {item.likes}</Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.caption}>
          {item.title || item.caption}
        </Text>

        <View style={styles.creatorRow}>
          <Image source={{ uri: item.creator.avatar }} style={styles.avatar} />
          <Text numberOfLines={1} style={styles.creatorName}>
            {item.creator.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Xử lý khi nhấn vào một tài khoản
  const handleAccountPress = (account: UserProfileItem) => {
    const myId = (isLoggedIn && user?.id) ? user.id : currentSessionUserId;
    const isSameId = Boolean(myId && account.id && String(myId).toLowerCase() === String(account.id).toLowerCase());
    const isSameName = Boolean(user?.name && account.name && user.name.trim().toLowerCase() === account.name.trim().toLowerCase());
    const isMe = isSameId || isSameName;

    if (isMe) {
      // Nếu là tài khoản của mình -> Chuyển sang Tab My Profile
      navigation.navigate('MainTabs', { screen: 'ProfileTab' });
    } else {
      // Nếu là tài khoản người khác -> Mở trang UserProfile
      navigation.navigate('UserProfile', { userId: account.id });
    }
  };

  // Render Account Item
  const renderAccountItem = (account: UserProfileItem) => {
    const isFollowing = followedIds.has(account.id) || !!account.isFollowing;
    
    // Kiểm tra xem có phải tài khoản của chính mình hay không
    const myId = (isLoggedIn && user?.id) ? user.id : currentSessionUserId;
    const isSameId = Boolean(myId && account.id && String(myId).toLowerCase() === String(account.id).toLowerCase());
    const isSameName = Boolean(user?.name && account.name && user.name.trim().toLowerCase() === account.name.trim().toLowerCase());
    const isMe = isSameId || isSameName;

    return (
      <TouchableOpacity
        key={account.id}
        style={styles.accountRow}
        activeOpacity={0.7}
        onPress={() => handleAccountPress(account)}
      >
        <Image source={{ uri: account.avatar }} style={styles.accountAvatar} />

        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{account.name}</Text>
          <Text numberOfLines={1} style={styles.accountBio}>
            {account.bio || 'Chưa có tiểu sử'}
          </Text>
          <Text style={styles.accountMeta}>
            <Text style={styles.accountMetaBold}>{account.followers}</Text> followers ·{' '}
            <Text style={styles.accountMetaBold}>{account.videosCount}</Text> videos
          </Text>
        </View>

        {!isMe && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFollow(account.id);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Render Audio Item
  const renderAudioItem = (audio: AudioTrackItem) => {
    const isPlaying = currentAudioId === audio.id && audioStatus.playing;
    return (
      <View key={audio.id} style={styles.audioRow}>
        <View style={styles.audioThumbWrapper}>
          <Image source={{ uri: audio.thumbnailUrl }} style={styles.audioThumb} />
          <TouchableOpacity
            style={styles.audioPlayOverlay}
            onPress={() => handleAudioPress(audio)}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.audioInfo}>
          <Text numberOfLines={1} style={styles.audioTitle}>
            {audio.title}
          </Text>
          <Text numberOfLines={1} style={styles.audioArtist}>
            {audio.artist}
          </Text>
          <View style={styles.audioMetaRow}>
            <Ionicons name="time-outline" size={12} color="#888" style={{ marginRight: 3 }} />
            <Text style={styles.audioMetaText}>{audio.durationFormatted}</Text>
            <Text style={styles.audioMetaDivider}>·</Text>
            <Ionicons name="musical-notes-outline" size={12} color="#888" style={{ marginRight: 3 }} />
            <Text style={styles.audioMetaText}>{audio.usesCount} videos</Text>
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

  const showInitialDiscovery = debouncedSearchText.trim() === '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* 1. Thanh tìm kiếm */}
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
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearIcon}>
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
        {/* Màn hình Khám phá ban đầu khi chưa gõ text */}
        {showInitialDiscovery ? (
          <View style={styles.discoveryContainer}>
            {/* Lịch sử tìm kiếm gần đây */}
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
                      >
                        <Ionicons name="close" size={14} color="#999999" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Chủ đề Hot / Thịnh hành */}
            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Trending topics</Text>
                <Ionicons name="flame" size={18} color="#FF2D55" />
              </View>
              <View style={styles.tagsGrid}>
                {defaultTrendingTags.map((tag, idx) => (
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
          </View>
        ) : (
          /* Khi đã nhập từ khóa: Hiển thị 3 Tabs theo SDS */
          <>
            <View style={styles.tabContainer}>
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
            </View>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF2442" />
                <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
              </View>
            ) : (
              <View style={{ minHeight: 300 }}>
                {/* TAB 1: TRENDING (VIDEOS TỪ SUPABASE) */}
                {activeTab === 'Trending' && (
                  <>
                    {filteredVideos.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="videocam-off-outline" size={54} color="#CCCCCC" />
                        <Text style={styles.emptyText}>
                          Không tìm thấy video nào cho &quot;{debouncedSearchText}&quot;
                        </Text>
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

                        {filteredVideos.length > displayCount && (
                          <TouchableOpacity
                            style={styles.showMoreButton}
                            onPress={handleShowMore}
                            disabled={isLoadingMore}
                          >
                            {isLoadingMore ? (
                              <ActivityIndicator size="small" color="#FF2442" />
                            ) : (
                              <>
                                <Text style={styles.showMoreText}>Show more</Text>
                                <Ionicons name="chevron-down" size={16} color="#FF2442" style={{ marginLeft: 4 }} />
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* TAB 2: ACCOUNTS (TỪ BẢNG PROFILES SUPABASE) */}
                {activeTab === 'Accounts' && (
                  <View style={styles.tabContentContainer}>
                    {accounts.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="person-outline" size={54} color="#CCCCCC" />
                        <Text style={styles.emptyText}>
                          Không tìm thấy tài khoản nào cho &quot;{debouncedSearchText}&quot;
                        </Text>
                      </View>
                    ) : (
                      accounts.map((acc) => renderAccountItem(acc))
                    )}
                  </View>
                )}

                {/* TAB 3: AUDIO (TỪ BẢNG AUDIO_TRACKS SUPABASE) */}
                {activeTab === 'Audio' && (
                  <View style={styles.tabContentContainer}>
                    {audios.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Ionicons name="musical-notes-outline" size={54} color="#CCCCCC" />
                        <Text style={styles.emptyText}>
                          Không tìm thấy âm thanh nào cho &quot;{debouncedSearchText}&quot;
                        </Text>
                      </View>
                    ) : (
                      audios.map((audio) => renderAudioItem(audio))
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Lọc */}
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
    fontWeight: 'bold',
    color: '#111111',
  },
  clearAllText: {
    fontSize: 13,
    color: '#999999',
  },
  recentChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  recentChipText: {
    fontSize: 13,
    color: '#333333',
  },
  removeChipBtn: {
    marginLeft: 6,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  tagHash: {
    color: '#FF2D55',
    fontWeight: 'bold',
    marginRight: 4,
  },
  tagText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#FF2D55',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888888',
  },
  activeTabText: {
    color: '#111111',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#888888',
    fontSize: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 14,
  },
  videoCard: {
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 9 / 14,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#EEEEEE',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  statsOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
    marginTop: 6,
    lineHeight: 18,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  avatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 6,
  },
  creatorName: {
    fontSize: 12,
    color: '#666666',
    flex: 1,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  showMoreText: {
    color: '#FF2D55',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    marginTop: 12,
    textAlign: 'center',
  },
  resetFilterButton: {
    marginTop: 16,
    backgroundColor: '#FF2D55',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetFilterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  tabContentContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111111',
  },
  accountBio: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  accountMeta: {
    fontSize: 12,
    color: '#888888',
    marginTop: 3,
  },
  accountMetaBold: {
    color: '#111111',
    fontWeight: '600',
  },
  followBtn: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  followingBtn: {
    backgroundColor: '#EAEAEA',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  followingBtnText: {
    color: '#333333',
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioThumbWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
  },
  audioThumb: {
    width: '100%',
    height: '100%',
  },
  audioPlayOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  audioArtist: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  audioMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  audioMetaText: {
    fontSize: 11,
    color: '#888888',
  },
  audioMetaDivider: {
    marginHorizontal: 4,
    color: '#888888',
  },
  audioUseBtn: {
    padding: 8,
  },
});
