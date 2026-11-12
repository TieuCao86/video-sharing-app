import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

// Services Supabase
import {
  getTrendingVideos,
  getVideosByTopic,
  VideoDetailItem,
} from "../../services";
import { PAGE_SIZE } from "../../services/videoService";
type SortOption = "latest" | "popular" | "views";

type RouteParams = {
  VideoList: {
    title: string;
    type?: "trending" | "topic";
    topicId?: string;
  };
};

function getTimeAgo(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} days ago`;
  return `${Math.floor(diffSec / 604800)} weeks ago`;
}

export const VideoListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, "VideoList">>();

  const title = route.params?.title || "Videos";
  const type = route.params?.type || "trending";
  const topicId = route.params?.topicId;

  const [videos, setVideos] = useState<VideoDetailItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  // NFR02: phân trang 20 bản ghi/trang
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const [sortBy, setSortBy] = useState<SortOption>("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { width } = useWindowDimensions();
  const PADDING_HORIZONTAL = 12;
  const COLUMN_GAP = 8;
  const cardWidth = (width - PADDING_HORIZONTAL * 2 - COLUMN_GAP) / 2;

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "latest", label: "Latest" },
    { value: "popular", label: "Most popular (Likes)" },
    { value: "views", label: "Most viewed" },
  ];

  // Fetch dữ liệu từ Supabase theo type: trending hoặc lọc theo topic
  const loadVideos = useCallback(
    async (pageToLoad: number = 1) => {
      try {
        let fetched: VideoDetailItem[] = [];
        if (type === "topic" && topicId) {
          fetched = await getVideosByTopic(topicId, pageToLoad);
        } else {
          // Mặc định hoặc View more Top trending
          fetched = await getTrendingVideos(PAGE_SIZE, undefined, pageToLoad);
        }
        setVideos((prev) => {
          if (pageToLoad === 1) return fetched;
          const seen = new Set(prev.map((v) => v.id));
          return [...prev, ...fetched.filter((v) => !seen.has(v.id))];
        });
        setPage(pageToLoad);
        setHasMore(fetched.length === PAGE_SIZE);
      } catch (err) {
        console.error("Error loading video list from Supabase:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [type, topicId],
  );

  useEffect(() => {
    loadVideos(1);
  }, [loadVideos]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVideos(1);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    loadVideos(page + 1);
  };

  // Sắp xếp danh sách video theo filter
  const sortedVideos = useMemo(() => {
    const list = [...videos];
    if (sortBy === "popular") {
      return list.sort((a, b) => b.likesCount - a.likesCount);
    }
    if (sortBy === "views") {
      return list.sort((a, b) => b.viewsCount - a.viewsCount);
    }
    // 'latest'
    return list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [videos, sortBy]);

  const handleVideoPress = (videoId: string) => {
    navigation.navigate("ReelDetail", { videoId });
  };

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top", "bottom", "left", "right"]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Ionicons name="funnel-outline" size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Sort Menu Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortBy(option.value);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
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
          Sorted by:{" "}
          <Text style={styles.sortInfoValue}>
            {sortOptions.find((opt) => opt.value === sortBy)?.label}
          </Text>
        </Text>
        <Text style={styles.countText}>{sortedVideos.length} videos</Text>
      </View>

      {/* Video Grid */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#FF2442" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF2442"]}
            />
          }
        >
          {sortedVideos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="videocam-off-outline" size={54} color="#CCCCCC" />
              <Text style={styles.emptyTitle}>Chưa có video nào</Text>
              <Text style={styles.emptySubTitle}>
                Chủ đề này chưa có video nào được tải lên.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.gridContainer,
                { paddingHorizontal: PADDING_HORIZONTAL },
              ]}
            >
              {sortedVideos.map((item, index) => {
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
                        source={{ uri: item.coverUrl }}
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
                      <View style={styles.timeBadge}>
                        <Text style={styles.timeBadgeText}>
                          {getTimeAgo(item.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text numberOfLines={2} style={styles.videoTitle}>
                      {item.title || item.caption}
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
          )}

          {/* NFR02: tải trang tiếp theo (20 video/trang) */}
          {sortedVideos.length > 0 && hasMore && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#FF2442" />
              ) : (
                <Text style={styles.loadMoreText}>Xem thêm</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  sortButton: {
    padding: 6,
  },
  sortMenu: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    paddingVertical: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionActive: {
    backgroundColor: "#FFF0F3",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#333333",
  },
  sortOptionTextActive: {
    color: "#FF2442",
    fontWeight: "600",
  },
  sortInfoBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  loadMoreButton: {
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF2442",
    minWidth: 120,
    alignItems: "center",
  },
  loadMoreText: {
    color: "#FF2442",
    fontWeight: "600",
  },
  sortInfoText: {
    fontSize: 13,
    color: "#666666",
  },
  sortInfoValue: {
    color: "#000000",
    fontWeight: "600",
  },
  countText: {
    fontSize: 13,
    color: "#888888",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 12,
  },
  videoCard: {
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 9 / 14,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#EEEEEE",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  statsOverlay: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 3,
  },
  timeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timeBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "500",
  },
  videoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000000",
    marginTop: 6,
    lineHeight: 18,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  creatorName: {
    fontSize: 12,
    color: "#666666",
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginTop: 12,
  },
  emptySubTitle: {
    fontSize: 13,
    color: "#888888",
    marginTop: 4,
    textAlign: "center",
  },
});
