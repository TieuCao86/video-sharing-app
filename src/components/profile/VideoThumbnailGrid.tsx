import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { VideoCard } from '../cards/VideoCard';
import { MOCK_VIDEOS_ARRAY } from '../../screens/reel/ReelDetailScreen';

interface VideoThumbnailGridProps {
  videos: { id: string; thumbnail: string; views?: string }[];
  showHeartIcon?: boolean;
  onVideoPress?: (
    video: { id: string; thumbnail: string; views?: string },
    index: number
  ) => void;
}

const getRandomVideoId = (): string => {
  if (MOCK_VIDEOS_ARRAY.length === 0) return '1';
  const index = Math.floor(Math.random() * MOCK_VIDEOS_ARRAY.length);
  return MOCK_VIDEOS_ARRAY[index].id;
};

export const VideoThumbnailGrid: React.FC<VideoThumbnailGridProps> = ({
  videos,
  showHeartIcon = false,
  onVideoPress,
}) => {
  const navigation = useNavigation<any>();

  const handlePress = (
    item: { id: string; thumbnail: string; views?: string },
    index: number
  ) => {
    if (onVideoPress) {
      onVideoPress(item, index);
    } else {
      const videoId = getRandomVideoId();
      navigation.navigate('ReelDetail', { videoId });
    }
  };

  return (
    <View style={styles.grid}>
      {videos.map((item, index) => (
        <VideoCard
          key={item.id}
          item={item}
          type="profile"
          showHeartIcon={showHeartIcon}
          onPress={() => handlePress(item, index)}
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
