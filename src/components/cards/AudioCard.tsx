import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface AudioCardProps {
  item: { id: string; title: string; subtitle: string; thumbnail: string };
  onPress: () => void;
}

export const AudioCard: React.FC<AudioCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.container}>
      <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
      <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
      <Text numberOfLines={1} style={styles.subtitle}>{item.subtitle}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 120,
    marginRight: 12,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#eee',
    marginBottom: 6,
  },
  title: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    color: '#777777',
    fontSize: 11,
  },
});