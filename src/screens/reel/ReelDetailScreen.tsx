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
  Alert,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoItem } from "../../components/VideoItem";
import { authStore, useAuthStore } from "../../store/useAuthStore";
import { useDraftsStore } from "../../store/useDraftsStore";
import { LoginRequiredModal } from "../../components/auth/LoginRequiredModal";
import { RootStackParamList } from "../../types/navigation";

// Services kết nối Supabase
import {
  getTrendingVideos,
  getVideoById,
  incrementVideoView,
  toggleLikeVideo,
  getCommentsByVideoId,
  addComment,
  toggleLikeComment,
  toggleFollowUser,
  softDeleteVideo,
  VideoDetailItem,
  CommentItem,
} from "../../services";

export interface VideoData {
  id: string;
  title?: string;
  url: string;
  creator: string;
  caption: string;
  audio: string;
}

export const MOCK_VIDEOS_ARRAY: VideoData[] = [
  {
    id: 'e0000001-0000-4000-8000-000000000001',
    title: 'Amazing sunset timelapse',
    url: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Video/360429_small.mp4',
    creator: 'Laura',
    caption: 'Amazing sunset timelapse #nature #sunset',
    audio: 'Summer Vibes - DJ Mix'
  },
  {
    id: 'e0000001-0000-4000-8000-000000000002',
    title: 'Travel vlog - Paris adventure',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    creator: 'William',
    caption: 'Travel vlog - Paris adventure #travel #paris',
    audio: 'La Vie En Rose - Edith Piaf'
  },
  {
    id: 'e0000001-0000-4000-8000-000000000003',
    title: 'She waits for me',
    url: 'https://download.samplelib.com/mp4/sample-5s.mp4',
    creator: 'Julia',
    caption: 'She waits for me #lovepet #cat',
    audio: 'Baby shark - Kingfong'
  },
  {
    id: 'e0000001-0000-4000-8000-000000000004',
    title: 'How to cook perfect pasta',
    url: 'https://download.samplelib.com/mp4/sample-10s.mp4',
    creator: 'Peter',
    caption: 'How to cook perfect pasta #cooking #food',
    audio: 'Italian Music - Bella Notte'
  }
];

export const ReelDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ReelDetail'>>();
  const flatListRef = useRef<FlatList>(null);
  const { checkAuth, user, isLoggedIn } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const initialVideoId = route.params?.videoId;
  const initialVideos = route.params?.videos;
  const initialIndex =
    initialVideos && initialVideoId
      ? Math.max(
        0,
        initialVideos.findIndex((v) => v.id === initialVideoId)
      )
      : 0;

  // Lấy db id & auth id của user đang đăng nhập (chỉ khi đã đăng nhập)
  const currentDbUserId = isLoggedIn && user?.id ? user.id : null;
  const currentAuthId = isLoggedIn && user?.auth_id ? user.auth_id : null;

  const [videos, setVideos] = useState<VideoDetailItem[]>(initialVideos || []);
  const [followingCreatorIds, setFollowingCreatorIds] = useState<Set<string>>(new Set());
  const [likingVideoIds, setLikingVideoIds] = useState<Set<string>>(new Set());
  const likingVideoIdsRef = useRef(new Set<string>());
  const [loading, setLoading] = useState(!initialVideos || initialVideos.length === 0);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Comments state
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const [likingCommentIds, setLikingCommentIds] = useState<Set<string>>(new Set());

  // Owner action menu state
  const [ownerMenuVisible, setOwnerMenuVisible] = useState(false);
  const [ownerMenuVideoId, setOwnerMenuVideoId] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  // Fetch danh sách video từ Supabase hoặc dùng danh sách truyền vào
  useEffect(() => {
    if (initialVideos && initialVideos.length > 0) {
      setVideos(initialVideos);
      const foundIdx = initialVideoId
        ? initialVideos.findIndex((v) => v.id === initialVideoId)
        : 0;
      setCurrentIndex(foundIdx !== -1 ? foundIdx : 0);
      setLoading(false);
      return;
    }

    async function loadVideos() {
      try {
        setLoading(true);
        let targetVideo: VideoDetailItem | null = null;

        // Nếu có initialVideoId, ưu tiên tìm / tải video cụ thể đó trước
        if (initialVideoId) {
          try {
            targetVideo = await getVideoById(
              initialVideoId,
              isLoggedIn ? currentDbUserId ?? undefined : undefined
            );
          } catch (e) {
            console.error("Error fetching video by id:", e);
          }

        }

        const fetchedVideos = await getTrendingVideos(
          20,
          isLoggedIn ? currentDbUserId ?? undefined : undefined
        );

        let finalVideos: VideoDetailItem[] = [];
        if (targetVideo) {
          finalVideos = [
            targetVideo,
            ...fetchedVideos.filter((v) => v.id !== targetVideo!.id),
          ];
        } else if (initialVideoId && fetchedVideos.length > 0) {
          const foundIdx = fetchedVideos.findIndex((v) => v.id === initialVideoId);
          if (foundIdx !== -1) {
            const foundVideo = fetchedVideos[foundIdx];
            finalVideos = [
              foundVideo,
              ...fetchedVideos.filter((_, idx) => idx !== foundIdx),
            ];
          } else {
            finalVideos = fetchedVideos;
          }
        } else {
          finalVideos = fetchedVideos;
        }

        setVideos(finalVideos);
        setCurrentIndex(0);
      } catch (err) {
        console.error("Error loading videos in ReelDetail:", err);
      } finally {
        setLoading(false);
      }
    }
    loadVideos();
  }, [initialVideoId, initialVideos, currentDbUserId, isLoggedIn]);

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

  const handleOpenComments = (videoId: string) => {
    setCommentVideoId(videoId);
    loadComments(videoId);
    setIsCommentVisible(true);
  };

  const handleAddComment = () => {
    const text = commentText.trim();
    const videoId = commentVideoId;
    if (!text || !videoId || postingComment) return;

    checkAuth(() => {
      const { isLoggedIn, user: currentUser } = authStore.getState();
      if (!isLoggedIn || !currentUser?.id) return;

      setPostingComment(true);
      addComment(videoId, currentUser.id, text)
        .then((newCmt) => {
          const comment: CommentItem = {
            ...newCmt,
            userName:
              newCmt.userName && newCmt.userName !== "Anonymous"
                ? newCmt.userName
                : currentUser.name || "Bạn",
            userAvatar: newCmt.userAvatar || currentUser.avatar,
          };
          setComments((prev) => [comment, ...prev]);
          setCommentText("");
          setVideos((prev) =>
            prev.map((v) =>
              v.id === videoId
                ? { ...v, commentsCount: (v.commentsCount || 0) + 1 }
                : v
            )
          );
        })
        .catch((err: any) => {
          Alert.alert(
            "Không thể gửi bình luận",
            err?.message || "Vui lòng thử lại."
          );
        })
        .finally(() => setPostingComment(false));
    });
  };

  const handleToggleCommentLike = (commentId: string) => {
    if (likingCommentIds.has(commentId)) return;

    checkAuth(() => {
      const { isLoggedIn, user: currentUser } = authStore.getState();
      if (!isLoggedIn || !currentUser?.id) return;

      setLikingCommentIds((prev) => new Set(prev).add(commentId));
      toggleLikeComment(currentUser.id, commentId)
        .then((result) => {
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === commentId
                ? { ...comment, isLiked: result.liked, likesCount: result.likesCount }
                : comment
            )
          );
        })
        .catch((err: any) => {
          Alert.alert(
            "Không thể thích bình luận",
            err?.message || "Vui lòng thử lại."
          );
        })
        .finally(() => {
          setLikingCommentIds((prev) => {
            const next = new Set(prev);
            next.delete(commentId);
            return next;
          });
        });
    });
  };

  const handleToggleLike = () => {
    const videoId = currentVideo?.id;
    if (!videoId || likingVideoIdsRef.current.has(videoId)) return;

    checkAuth(() => {
      likingVideoIdsRef.current.add(videoId);
      setLikingVideoIds((prev) => new Set(prev).add(videoId));

      void toggleLikeVideo(user.id, videoId)
        .then((nextLikedState) => {
          setVideos((prev) =>
            prev.map((video) => {
              if (video.id !== videoId || !!video.isLiked === nextLikedState) return video;

              return {
                ...video,
                isLiked: nextLikedState,
                likesCount: Math.max(video.likesCount + (nextLikedState ? 1 : -1), 0),
              };
            })
          );
        })
        .catch((err: unknown) => {
          console.error("Error toggle like video:", err);
          Alert.alert(
            "Không thể cập nhật lượt thích",
            err instanceof Error ? err.message : "Vui lòng thử lại."
          );
        })
        .finally(() => {
          likingVideoIdsRef.current.delete(videoId);
          setLikingVideoIds((prev) => {
            const next = new Set(prev);
            next.delete(videoId);
            return next;
          });
        });
    });
  };

  const handleToggleFollow = (creatorId: string) => {
    if (!creatorId || followingCreatorIds.has(creatorId)) return;

    checkAuth(() => {
      if (!user.auth_id) {
        Alert.alert('Không thể theo dõi', 'Không tìm thấy tài khoản đăng nhập. Vui lòng đăng nhập lại.');
        return;
      }

      setFollowingCreatorIds((prev) => new Set(prev).add(creatorId));
      toggleFollowUser(user.auth_id, creatorId)
        .then((isFollowing) => {
          setVideos((prev) =>
            prev.map((video) =>
              video.creator.id === creatorId
                ? { ...video, creator: { ...video.creator, isFollowing } }
                : video
            )
          );
        })
        .catch((err: any) => {
          Alert.alert('Không thể cập nhật theo dõi', err?.message || 'Vui lòng thử lại.');
        })
        .finally(() => {
          setFollowingCreatorIds((prev) => {
            const next = new Set(prev);
            next.delete(creatorId);
            return next;
          });
        });
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  // Hiện menu chủ sở hữu (xóa / chỉnh sửa)
  const handleMorePress = (videoId: string) => {
    setOwnerMenuVideoId(videoId);
    setOwnerMenuVisible(true);
  };

  // Xóa mềm video
  const handleDeleteVideo = () => {
    if (!ownerMenuVideoId || !user?.id) return;
    const videoId = ownerMenuVideoId;
    Alert.alert(
      'Xóa video',
      'Video sẽ bị ẩn khỏi ứng dụng. Bạn có chắc chắn muốn xóa?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setOwnerMenuVisible(false);
            setDeletingVideoId(videoId);
            try {
              await softDeleteVideo(videoId, user.id);
              setVideos((prev) => prev.filter((v) => v.id !== videoId));
              // Điều chỉnh index nếu cần
              setCurrentIndex((prev) => Math.max(0, prev > 0 ? prev - 1 : 0));
            } catch (err: any) {
              Alert.alert('Không thể xóa', err?.message || 'Vui lòng thử lại.');
            } finally {
              setDeletingVideoId(null);
            }
          },
        },
      ],
    );
  };

  // Điều hướng sang màn hình chỉnh sửa
  const handleEditVideo = () => {
    if (!ownerMenuVideoId) return;
    const video = videos.find((v) => v.id === ownerMenuVideoId);
    if (!video) return;
    setOwnerMenuVisible(false);

    // Tách description và hashtags từ caption/description
    const rawDescription = video.caption || '';
    const hashtagRegex = /#([A-Za-z0-9_]{1,30})/g;
    const hashtags: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(rawDescription)) !== null) {
      hashtags.push(match[1]);
    }
    const descriptionOnly = rawDescription
      .replace(/#[A-Za-z0-9_]{1,30}/g, '')
      .trim();

    navigation.navigate('EditVideo', {
      videoId: video.id,
      title: video.title,
      description: descriptionOnly,
      hashtags: hashtags.join(' '),
      topicId: undefined,
      visibility: video.visibility,
    });
  };

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
        initialScrollIndex={initialIndex > 0 && initialIndex < videos.length ? initialIndex : undefined}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          }, 50);
        }}
        renderItem={({ item, index }) => (
          <VideoItem
            video={{
              id: item.id,
              title: item.title,
              url: item.videoUrl,
              creatorId: item.creator?.id || '',
              creator: item.creator?.name || 'User',
              creatorAvatar: item.creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
              canFollow: !!item.creator?.id && item.creator?.id !== currentDbUserId,
              isFollowing: !!item.creator?.isFollowing,
              caption: item.caption,
              audio: item.audioTrack?.title || 'Original Sound',
            }}
            itemHeight={screenHeight}
            isActive={currentIndex === index}
            likes={item.likesCount}
            isLiked={!!item.isLiked}
            isLikeLoading={likingVideoIds.has(item.id)}
            commentsCount={item.commentsCount}
            onLikePress={handleToggleLike}
            onCommentPress={() => handleOpenComments(item.id)}
            onFollowPress={() => handleToggleFollow(item.creator.id)}
            isFollowLoading={followingCreatorIds.has(item.creator.id)}
            onCreatorPress={() => {
              if (item.creator.id) {
                if (item.creator.id === currentDbUserId) {
                  navigation.navigate('MainTabs', { screen: 'ProfileTab' });
                } else {
                  navigation.push('UserProfile', { userId: item.creator.id });
                }
              }
            }}
            onMorePress={
              isLoggedIn &&
                Boolean(item.creator.id) &&
                (item.creator.id === currentDbUserId ||
                  (Boolean(currentAuthId) && item.creator.id === currentAuthId))
                ? () => handleMorePress(item.id)
                : undefined
            }
          />
        )}
      />

      {/* OWNER ACTION MENU (xóa / chỉnh sửa) */}
      <Modal
        visible={ownerMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOwnerMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setOwnerMenuVisible(false)}
        >
          <View style={[styles.menuSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.menuHandle} />
            <Text style={styles.menuTitle}>Tùy chọn video</Text>

            {/* Nút Chỉnh sửa */}
            <TouchableOpacity style={styles.menuItem} onPress={handleEditVideo}>
              <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="create-outline" size={22} color="#4F6EF7" />
              </View>
              <View style={styles.menuItemTextBox}>
                <Text style={styles.menuItemTitle}>Chỉnh sửa thông tin</Text>
                <Text style={styles.menuItemDesc}>Cập nhật tiêu đề, hashtag, chủ đề, quyền xem</Text>
              </View>
            </TouchableOpacity>

            {/* Nút Xóa */}
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteVideo}>
              <View style={[styles.menuIconBox, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </View>
              <View style={styles.menuItemTextBox}>
                <Text style={[styles.menuItemTitle, { color: '#EF4444' }]}>Xóa video</Text>
                <Text style={styles.menuItemDesc}>Video sẽ bị ẩn khỏi ứng dụng</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    <Image source={{ uri: item.userAvatar }} style={styles.commentAvatar} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.commentAuthor}>{item.userName}</Text>
                      <Text style={styles.commentBody}>{item.content}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.commentLikeBtn}
                      onPress={() => handleToggleCommentLike(item.id)}
                      disabled={likingCommentIds.has(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name={item.isLiked ? "heart" : "heart-outline"}
                        size={16}
                        color={item.isLiked ? "#FF2442" : "#888888"}
                      />
                      {(item.likesCount ?? 0) > 0 ? (
                        <Text
                          style={[
                            styles.commentLikeCount,
                            item.isLiked && styles.commentLikeCountActive,
                          ]}
                        >
                          {item.likesCount}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
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
                editable={!postingComment}
                maxLength={500}
                returnKeyType="send"
                blurOnSubmit={false}
                onSubmitEditing={handleAddComment}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                style={styles.sendBtn}
                disabled={postingComment || !commentText.trim()}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color="#FF2442" />
                ) : (
                  <Ionicons
                    name="send"
                    size={20}
                    color={commentText.trim() ? "#FF2442" : "#CCCCCC"}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <LoginRequiredModal />

      {/* Delete loading overlay */}
      {deletingVideoId && (
        <View style={styles.deleteOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.deleteOverlayText}>Đang xóa...</Text>
        </View>
      )}
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
    alignItems: "flex-start",
    marginBottom: 14,
  },
  commentLikeBtn: {
    alignItems: "center",
    marginLeft: 8,
    marginTop: 2,
    minWidth: 24,
  },
  commentLikeCount: {
    fontSize: 11,
    color: "#888888",
    marginTop: 2,
  },
  commentLikeCountActive: {
    color: "#FF2442",
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
  // Delete loading overlay
  deleteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  deleteOverlayText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },
  // Owner action menu styles
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  menuHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    marginBottom: 16,
    borderRadius: 2,
    backgroundColor: "#D5D5DA",
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#17171B",
    marginBottom: 16,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  menuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemTextBox: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#17171B",
    marginBottom: 2,
  },
  menuItemDesc: {
    fontSize: 12,
    color: "#85858E",
  },
});
