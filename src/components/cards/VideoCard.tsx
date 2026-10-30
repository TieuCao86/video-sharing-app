import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { VideoItem } from "../../types/video.type";

interface VideoCardProps {
  item:
    | VideoItem
    | {
        id: string;
        title?: string;
        thumbnail: string;
        views: string;
        timeAgo?: string;
      };
  onPress: () => void;
  type?: "trending" | "profile";
}

const { width } = Dimensions.get("window");

// Hàm kiểm tra xem item có phải là VideoItem đầy đủ hay không
const isVideoItem = (obj: any): obj is VideoItem => {
  return "stats" in obj && "coverUrl" in obj;
};

export const VideoCard: React.FC<VideoCardProps> = ({
  item,
  onPress,
  type = "trending",
}) => {
  // Lấy dữ liệu linh hoạt dựa vào kiểu của item
  const thumbnailUri = isVideoItem(item) ? item.coverUrl : item.thumbnail;
  const titleText = isVideoItem(item) ? item.caption : item.title || "";
  const viewsText = isVideoItem(item) ? item.stats.views : item.views;
  const timeAgoText = !isVideoItem(item) ? item.timeAgo : undefined;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        type === "profile" ? styles.profileCard : styles.trendingCard,
      ]}
    >
      <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />

      {/* Overlay thông tin */}
      <View style={styles.overlay}>
        {timeAgoText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{timeAgoText}</Text>
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text numberOfLines={1} style={styles.title}>
            {titleText}
          </Text>
          <Text style={styles.views}>▶ {viewsText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#111",
    marginRight: 12,
    marginBottom: 12,
  },
  trendingCard: {
    width: 150,
    height: 220,
  },
  profileCard: {
    width: (width - 48) / 3,
    height: 160,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  badge: {
    backgroundColor: "rgba(255, 36, 66, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  infoContainer: {
    justifyContent: "flex-end",
  },
  title: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  views: {
    color: "#ddd",
    fontSize: 11,
  },
});
