import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Filter } from './FilterBottomSheet';

interface FilterOverlayProps {
  filter: Filter | null;
}

export const FilterOverlay: React.FC<FilterOverlayProps> = ({ filter }) => {
  console.log('FilterOverlay - filter:', filter?.name, filter?.style);
  
  if (!filter || !filter.style) return null;

  const { tintColor, brightness, contrast, saturation } = filter.style;

  // Skip if it's the "Normal" filter with empty style
  if (!tintColor && !brightness && !contrast && saturation === undefined) {
    return null;
  }

  // Create filter overlay styles
  const overlayStyles: any[] = [styles.overlay];

  if (tintColor) {
    overlayStyles.push({ backgroundColor: tintColor });
  }

  // Note: brightness, contrast, saturation would need native modules for true effect
  // For now, we simulate with opacity and color overlays
  
  return (
    <>
      {tintColor && <View style={overlayStyles} pointerEvents="none" />}
      
      {/* Brightness effect simulation */}
      {brightness && brightness > 1 && (
        <View 
          style={[styles.overlay, { backgroundColor: `rgba(255, 255, 255, ${(brightness - 1) * 0.5})` }]} 
          pointerEvents="none" 
        />
      )}
      
      {/* Contrast/Dramatic effect simulation */}
      {contrast && contrast > 1 && (
        <View 
          style={[styles.overlay, { backgroundColor: `rgba(0, 0, 0, ${(contrast - 1) * 0.25})` }]} 
          pointerEvents="none" 
        />
      )}

      {/* Black & White effect simulation */}
      {saturation === 0 && (
        <View 
          style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} 
          pointerEvents="none" 
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  grayscale: {
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    mixBlendMode: 'saturation', // This won't work in RN, but keeping for reference
  },
});
