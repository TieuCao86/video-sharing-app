import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { VideoItem } from "../../components/VideoItem";

const { width, height } = Dimensions.get("window");

// Mock video data - Using reliable public video URLs
interface VideoData {
  id: string;
  url: string;
  creator: string;
  caption: string;
  audio: string;
}

const MOCK_VIDEOS_ARRAY: VideoData[] = [
  {
    id: '1',
    url: 'https://dzxgzevcljyueztpbnir.supabase.co/storage/v1/object/public/Video/360429_small.mp4',
    creator: 'Laura',
    caption: 'Amazing sunset timelapse #nature #sunset',
    audio: 'Summer Vibes - DJ Mix'
  },
  {
    id: '2',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    creator: 'William',
    caption: 'Travel vlog - Paris adventure #travel #paris',
    audio: 'La Vie En Rose - Edith Piaf'
  },
  {
    id: '3',
    url: 'https://download.samplelib.com/mp4/sample-5s.mp4',
    creator: 'Julia',
    caption: 'She waits for me #lovepet #cat',
    audio: 'Baby shark - Kingfong'
  },
  {
    id: '4',
    url: 'https://download.samplelib.com/mp4/sample-10s.mp4',
    creator: 'Peter',
    caption: 'How to cook perfect pasta #cooking #food',
    audio: 'Italian Music - Bella Notte'
  },
  {
    id: '5',
    url: 'https://download.samplelib.com/mp4/sample-15s.mp4',
    creator: 'Adam',
    caption: 'Epic mountain climbing #adventure #mountain',
    audio: 'Epic Journey - Hans Zimmer'
  },
  {
    id: '6',
    url: 'https://download.samplelib.com/mp4/sample-20s.mp4',
    creator: 'Liz',
    caption: 'Dance performance highlights #dance #performance',
    audio: 'Pop Hit - Dance Mix'
  },
];

// Dữ liệu mẫu bình luận
const mockComments = [
  {
    id: "1",
    user: { name: "Laura", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" },
    content: "So cute, I wish my cat was like that",
    timeAgo: "6 mins ago",
    isLiked: false,
  },
  {
    id: "2",
    user: { name: "Lauren", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100" },
    content: 'Look at her, as if "mom, i want food"',
    timeAgo: "20 mins ago",
    isLiked: false,
  },
  {
    id: "3",
    user: { name: "Liz", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    content:
      "My cats also often wait for me to come home from work in front of the door hehe",
    timeAgo: "24 mins ago",
    isLiked: false,
  },
  {
    id: "4",
    user: { name: "Anne", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100" },
    content: "Awwwwww",
    timeAgo: "30 mins ago",
    isLiked: false,
  },
  {
    id: "5",
    user: { name: "Larry", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100" },
    content: "I want to cuddle",
    timeAgo: "20 mins ago",
    isLiked: false,
  },
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
  
  const videoId = route.params?.videoId || '3';
  
  // Find initial index based on videoId
  const initialIndex = MOCK_VIDEOS_ARRAY.findIndex(v => v.id === videoId);
  const startIndex = initialIndex !== -1 ? initialIndex : 0;
  
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(mockComments);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(19600);

  // Scroll to initial video on mount
  useEffect(() => {
    if (flatListRef.current && startIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: startIndex,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      user: { name: "You", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" },
      content: commentText,
      timeAgo: "Just now",
      isLiked: false,
    };
    setComments([newComment, ...comments]);
    setCommentText("");
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const renderVideoItem = ({ item, index }: { item: VideoData; index: number }) => (
    <VideoItem
      video={item}
      isActive={index === currentIndex}
      onCommentPress={() => setIsCommentVisible(true)}
      likes={likes}
      isLiked={isLiked}
      onLikePress={handleLike}
      commentsCount={comments.length}
    />
  );

  return (
    <View style={styles.container}>
      {/* Video FlatList - Vertical Paging */}
      <FlatList
        ref={flatListRef}
        data={MOCK_VIDEOS_ARRAY}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />

      {/* Close Button Overlay */}
      <SafeAreaView style={styles.closeButtonContainer}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* MODAL COMMENTS */}
      <Modal
        visible={isCommentVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCommentVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setIsCommentVisible(false)}
          />

          <View style={styles.commentSheetContainer}>
            {/* Header của Modal */}
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>{comments.length} comments</Text>
              <TouchableOpacity onPress={() => setIsCommentVisible(false)}>
                <Ionicons name="close" size={22} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Danh sách bình luận */}
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
              }}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{ uri: item.user.avatar }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContentWrapper}>
                    <Text style={styles.commentUsername}>{item.user.name}</Text>
                    <Text style={styles.commentText}>{item.content}</Text>
                    <Text style={styles.commentTime}>{item.timeAgo}</Text>
                  </View>
                  <TouchableOpacity style={styles.heartButton}>
                    <Ionicons name="heart-outline" size={18} color="#888888" />
                  </TouchableOpacity>
                </View>
              )}
            />

            {/* Ô nhập bình luận */}
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Leave comment..."
                placeholderTextColor="#888"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                onPress={handleAddComment}
                style={styles.sendButton}
              >
                <Ionicons name="send" size={18} color="#FF2442" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 100,
  },
  closeButton: {
    padding: 16,
  },
  // Styles cho Modal Comments
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalDismissArea: {
    flex: 1,
  },
  commentSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.65,
    paddingTop: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EFEFEF",
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  commentItem: {
    flexDirection: "row",
    marginTop: 16,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  commentContentWrapper: {
    flex: 1,
    marginRight: 12,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 11,
    color: "#888888",
  },
  heartButton: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: "#000000",
  },
  sendButton: {
    marginLeft: 12,
    padding: 8,
  },
});
