import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BrowseTopic } from '../../types/video.type';
import { Ionicons } from '@expo/vector-icons';

interface BrowseTopicsProps {
  topics: BrowseTopic[];
  onTopicPress: (topic: BrowseTopic) => void;
}

export const BrowseTopics: React.FC<BrowseTopicsProps> = ({ topics, onTopicPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Browse topic</Text>
      <View style={styles.grid}>
        {topics.map((topic) => (
          <TouchableOpacity 
            key={topic.id} 
            style={styles.topicCard} 
            onPress={() => onTopicPress(topic)}
            activeOpacity={0.7}
          >
            <Ionicons name={(topic.icon as any) || 'compass-outline'} size={22} color="#FF2442" />
            <Text numberOfLines={1} style={styles.topicName}>{topic.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  headerTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  topicCard: {
    width: '23%',
    backgroundColor: '#F7F7F7', // Nền xám sáng cho Light Mode
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  topicName: {
    color: '#333333',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
  },
});