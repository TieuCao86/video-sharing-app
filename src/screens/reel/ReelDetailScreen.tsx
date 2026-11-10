import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoItem } from "../../components/VideoItem";
import { useAuthStore } from "../../store/useAuthStore";
import { LoginRequiredModal } from "../../components/auth/LoginRequiredModal";

// Services kết nối Supabase
import {
  getTrendingVideos,
  incrementVideoView,
  toggleLikeVideo,
  getCommentsByVideoId,
  addComment,
  VideoDetailItem,
  CommentItem,
} from "../../services";

export interface VideoData {
  id: string;
  url: string;
  creator: string;
  caption: string;
  audio: string;
}

export const MOCK_VIDEOS_ARRAY: VideoData[] = [
  {
    id: 'e0000001-0000-4000-8000-000000000001',
    url: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Video/360429_small.mp4',
    creator: 'Laura',
    caption: 'Amazing sunset timelapse #nature #sunset',
    audio: 'Summer Vibes - DJ Mix'
  },
  {
    id: 'e0000001-0000-4000-8000-000000000002',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    creator: 'William',
    caption: 'Travel vlog - Paris adventure #travel #paris',
    audio: 'La Vie En Rose - Edith Piaf'
  },
  {
    id: 'e0000001-0000-4000-8000-000000000003',
    url: 'https://download.samplelib.com/mp4/sample-5s.mp4',
    creator: 'Julia',
    caption: 'She waits for me #lovepet #cat',
    audio: 'Baby shark - Kingfong'
  },
  {
    id: 'e0000001-0000-4000-8000-000000000004',
    url: 'https://download.samplelib.com/mp4/sample-10s.mp4',
    creator: 'Peter',
    caption: 'How to cook perfect pasta #cooking #food',
    audio: 'Italian Music - Bella Notte'
  }
];

type RouteParams = {
  ReelDetail: {
    videoId: string;
  };
};

export const ReelDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'ReelDetail'>>();
  const flatListRef = useRef<FlatList>(null);
  const { checkAuth, user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  
  const initialVideoId = route.params?.videoId;
  // Lấy db id của user đang đăng nhập (dùng để check isLiked & tạo notification)
  const currentDbUserId = user?.id ?? null;

  const [videos, setVideos] = useState<VideoDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Comments state
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // Fetch danh sách video từ Supabase
  useEffect(() => {
    async function loadVideos() {
      try {
        const fetchedVideos = await getTrendingVideos(20, currentDbUserId ?? undefined);
        setVideos(fetchedVideos);

        // Tìm vị trí của video được nhấn từ danh sách
        if (initialVideoId && fetchedVideos.length > 0) {
          const foundIdx = fetchedVideos.findIndex((v) => v.id === initialVideoId);
          if (foundIdx !== -1) {
            setCurrentIndex(foundIdx);
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: foundIdx,
                animated: false,
              });
            }, 100);
          }
        }
      } catch (err) {
        console.error("Error loading videos in ReelDetail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [initialVideoId, currentDbUserId]);

  const currentVideo = videos[currentIndex];

  // Khi chuyển video -> Tăng lượt xem (UC12)
  useEffect(() => {
    if (currentVideo?.id) {
      incrementVideoView(currentVideo.id);
    }
  }, [currentIndex, currentVideo?.id]);

  // Load comments từ Supabase khi mở Modal bình luận
  const loadComments = useCallback(async (vidId: string) => {
    setLoadingComments(true);
    try {
      const data = await getCommentsByVideoId(vidId, user?.id);
      setComments(data);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [user?.id]);

  const handleOpenComments = () => {
    if (currentVideo?.id) {
      loadComments(currentVideo.id);
      setIsCommentVisible(true);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentVideo?.id) return;

    checkAuth(async () => {
      try {
        const newCmt = await addComment(currentVideo.id, user.id, commentText);
        setComments((prev) => [newCmt, ...prev]);
        setCommentText("");
        // Cập nhật số đếm comment trên video
        setVideos((prev) =>
          prev.map((v, i) =>
            i === currentIndex ? { ...v, commentsCount: v.commentsCount + 1 } : v
          )
        );
      } catch (err: any) {
        alert(err.message || "Không thể gửi bình luận");
      }
    });
  };

  const handleToggleLike = async () => {
    if (!currentVideo?.id) return;

    checkAuth(async () => {
      try {
        const nextLikedState = await toggleLikeVideo(user.id, currentVideo.id);
        setVideos((prev) =>
          prev.map((v, i) => {
            if (i === currentIndex) {
              return {
                ...v,
                isLiked: nextLikedState,
                likesCount: nextLikedState ? v.likesCount + 1 : Math.max(v.likesCount - 1, 0),
              };
            }
            return v;
          })
        );
      } catch (err) {
        console.error("Error toggle like video:", err);
      }
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#FF2442" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Nút Back / Đóng toàn màn hình */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="close" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={videos}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={screenHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, index) => ({
          length: screenHeight,
          offset: screenHeight * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <VideoItem
            video={{
              id: item.id,
              url: item.videoUrl,
              creator: item.creator.name,
              caption: item.caption,
              audio: item.audioTrack?.title || 'Original Sound',
            }}
            itemHeight={screenHeight}
            isActive={currentIndex === index}
            likes={item.likesCount}
            isLiked={!!item.isLiked}
            commentsCount={item.commentsCount}
            onLikePress={handleToggleLike}
            onCommentPress={handleOpenComments}
          />
        )}
      />

      {/* MODAL COMMENT (BOTTOM SHEET S04) */}
      <Modal
        visible={isCommentVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCommentVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <View style={styles.commentSheet}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>{comments.length} comments</Text>
              <TouchableOpacity onPress={() => setIsCommentVisible(false)}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <View style={{ flex: 1, justifyContent: "center" }}>
                <ActivityIndicator size="small" color="#FF2442" />
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.commentAuthor}>{item.userName}</Text>
                      <Text style={styles.commentBody}>{item.content}</Text>
                    </View>
                    <Ionicons name="heart-outline" size={16} color="#888888" />
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyCommentText}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
                }
              />
            )}

            {/* Input thêm bình luận */}
            <View style={[styles.commentInputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TextInput
                style={styles.commentInput}
                placeholder="Leave comment..."
                placeholderTextColor="#999999"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={handleAddComment} style={styles.sendBtn}>
                <Ionicons name="send" size={20} color="#FF2442" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <LoginRequiredModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  centerLoading: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    left: 16,
    zIndex: 99,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  commentSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "60%",
    padding: 16,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEEEEE",
  },
  commentTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentAuthor: {
    fontWeight: "bold",
    fontSize: 13,
  },
  commentBody: {
    fontSize: 13,
    color: "#333333",
    marginTop: 2,
  },
  emptyCommentText: {
    textAlign: "center",
    color: "#888888",
    marginTop: 40,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#EEEEEE",
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 10,
    padding: 6,
  },
});
