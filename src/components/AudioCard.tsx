import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AudioCardProps {
  id?: string;
  title: string;
  artist: string;
  thumbnail: string;
  isPlaying: boolean;
  onPress: () => void;
}

export const AudioCard: React.FC<AudioCardProps> = ({
  title,
  artist,
  thumbnail,
  isPlaying,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Thumbnail with Play/Pause Overlay */}
      <View style={styles.thumbnailContainer}>
        <Image 
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
        />
        <View style={styles.playOverlay}>
          <Ionicons 
            name={isPlaying ? 'pause' : 'play'} 
            size={28} 
            color="#FFFFFF" 
          />
        </View>
      </View>

      {/* Audio Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {artist}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 140,
    marginRight: 12,
  },
  thumbnailContainer: {
    width: 140,
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  artist: {
    fontSize: 12,
    color: '#666666',
  },
});
