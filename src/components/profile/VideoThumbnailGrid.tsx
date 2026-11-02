import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoCard } from '../cards/VideoCard';

interface VideoThumbnailGridProps {
  videos: { id: string; thumbnail: string; views?: string }[];
  showHeartIcon?: boolean;
}

export const VideoThumbnailGrid: React.FC<VideoThumbnailGridProps> = ({
  videos,
  showHeartIcon = false,
}) => {
  return (
    <View style={styles.grid}>
      {videos.map((item) => (
        <VideoCard
          key={item.id}
          item={item}
          type="profile"
          showHeartIcon={showHeartIcon}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 6,
    paddingTop: 8,
    paddingBottom: 24,
  },
});
