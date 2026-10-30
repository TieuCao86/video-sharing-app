import React from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Story } from '../../types/video.type';

interface StoryListProps {
  stories: Story[];
  onStoryPress: (story: Story) => void;
}

export const StoryList: React.FC<StoryListProps> = ({ stories, onStoryPress }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {stories.map((story) => (
        <TouchableOpacity key={story.id} style={styles.storyItem} onPress={() => onStoryPress(story)}>
          <View style={[styles.avatarRing, story.hasStory && styles.activeRing]}>
            <Image source={{ uri: story.avatar }} style={styles.avatar} />
          </View>
          <Text numberOfLines={1} style={styles.name}>{story.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeRing: {
    borderColor: '#FF2442', // Màu hồng chủ đạo
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    resizeMode: 'cover',
  },
  name: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
});