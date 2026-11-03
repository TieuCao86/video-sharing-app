import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

// Dữ liệu mẫu bình luận bám sát thiết kế hình 2
const mockComments = [
  {
    id: "1",
    user: { name: "Laura", avatar: "https://example.com/avatar1.jpg" },
    content: "So cute, I wish my cat was like that",
    timeAgo: "6 mins ago",
    isLiked: false,
  },
  {
    id: "2",
    user: { name: "Lauren", avatar: "https://example.com/avatar2.jpg" },
    content: 'Look at her, as if "mom, i want food"',
    timeAgo: "20 mins ago",
    isLiked: false,
  },
  {
    id: "3",
    user: { name: "Liz", avatar: "https://example.com/avatar3.jpg" },
    content:
      "My cats also often wait for me to come home from work in front of the door hehe",
    timeAgo: "24 mins ago",
    isLiked: false,
  },
  {
    id: "4",
    user: { name: "Anne", avatar: "https://example.com/avatar4.jpg" },
    content: "Awwwwww",
    timeAgo: "30 mins ago",
    isLiked: false,
  },
  {
    id: "5",
    user: { name: "Larry", avatar: "https://example.com/avatar5.jpg" },
    content: "I want to cuddle",
    timeAgo: "20 mins ago",
    isLiked: false,
  },
];

export const ReelDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(mockComments);

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      user: { name: "You", avatar: "https://example.com/my-avatar.jpg" },
      content: commentText,
      timeAgo: "Just now",
      isLiked: false,
    };
    setComments([newComment, ...comments]);
    setCommentText("");
  };

  return (
    <View style={styles.container}>
      {/* 1. Nền video / Hình ảnh mô phỏng */}
      <Image
        source={{ uri: "https://example.com/cat-video-cover.jpg" }}
        style={styles.backgroundImage}
      />

      {/* Lớp phủ màu tối nhẹ phía dưới để làm nổi bật chữ */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        {/* Nút đóng (X) ở góc trên bên phải */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Cụm tương tác bên phải (Avatar, Like, Comment, More) */}
        <View style={styles.rightActionsContainer}>
          <View style={styles.avatarWrapper}>
            <Image
              source={{ uri: "https://example.com/avatar1.jpg" }}
              style={styles.creatorAvatar}
            />
            <View style={styles.plusBadge}>
              <Ionicons name="add" size={10} color="#FFFFFF" />
            </View>
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart" size={28} color="#FF2442" />
            <Text style={styles.actionText}>19.6k</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setIsCommentVisible(true)} // Mở Modal Comments
          >
            <Ionicons name="chatbubble-outline" size={26} color="#FFFFFF" />
            <Text style={styles.actionText}>700</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Thông tin tác giả & Tiêu đề video ở góc dưới bên trái */}
        <View style={styles.bottomInfoContainer}>
          <Text style={styles.creatorName}>Laura</Text>
          <Text style={styles.caption}>
            She waits for me <Text style={styles.hashtag}>#lovepet #cat</Text>
          </Text>

          <View style={styles.audioRow}>
            <Ionicons name="musical-note" size={14} color="#FFFFFF" />
            <Text style={styles.audioText} numberOfLines={1}>
              {" "}
              Baby shark - Kingfong
            </Text>
          </View>
        </View>

        {/* Thanh tiến trình video phía dưới cùng */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressFilled} />
        </View>
      </SafeAreaView>

      {/* 2. MODAL COMMENTS (Hiển thị khi bấm vào nút bình luận - Hình 2) */}
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
              <Text style={styles.commentTitle}>700 comments</Text>
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

            {/* Ô nhập bình luận ở đáy modal */}
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
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 16,
  },
  rightActionsContainer: {
    position: "absolute",
    right: 12,
    bottom: 100,
    alignItems: "center",
  },
  avatarWrapper: {
    marginBottom: 20,
    position: "relative",
  },
  creatorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  plusBadge: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    backgroundColor: "#FF2442",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  bottomInfoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    width: "80%",
  },
  creatorName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
  hashtag: {
    fontWeight: "600",
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  audioText: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    width: "100%",
  },
  progressFilled: {
    width: "60%",
    height: "100%",
    backgroundColor: "#FF2442",
  },
  // Styles cho Modal Comments (Hình 2)
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
