import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export interface Filter {
  id: string;
  name: string;
  icon: string;
  category: 'foryou' | 'trending' | 'saved';
  style?: {
    tintColor?: string;
    brightness?: number;
    contrast?: number;
    saturation?: number;
  };
}

const FILTERS: Filter[] = [
  // All filters in one list
  { 
    id: 'none', 
    name: 'Normal', 
    icon: '✨', 
    category: 'foryou',
    style: {} 
  },
  { 
    id: 'test', 
    name: 'Test Red', 
    icon: '🔴', 
    category: 'foryou',
    style: { tintColor: 'rgba(255, 0, 0, 0.6)' }
  },
  { 
    id: 'film', 
    name: 'Film', 
    icon: '🎞️', 
    category: 'foryou',
    style: { tintColor: 'rgba(255, 100, 0, 0.5)' }
  },
  { 
    id: 'blackwhite', 
    name: 'Black white', 
    icon: '⚫', 
    category: 'foryou',
    style: { saturation: 0 }
  },
  { 
    id: 'natural', 
    name: 'Natural', 
    icon: '🌿', 
    category: 'foryou',
    style: { tintColor: 'rgba(100, 200, 100, 0.25)' }
  },
  { 
    id: 'art', 
    name: 'Art', 
    icon: '🎨', 
    category: 'foryou',
    style: { tintColor: 'rgba(200, 100, 255, 0.3)', contrast: 1.2 }
  },
  { 
    id: 'vintage', 
    name: 'Vintage', 
    icon: '📷', 
    category: 'foryou',
    style: { tintColor: 'rgba(255, 180, 120, 0.35)' }
  },
  { 
    id: 'spring', 
    name: 'Spring', 
    icon: '🌸', 
    category: 'foryou',
    style: { tintColor: 'rgba(255, 150, 200, 0.3)' }
  },
  { 
    id: 'baby', 
    name: 'Baby', 
    icon: '👶', 
    category: 'foryou',
    style: { tintColor: 'rgba(255, 220, 230, 0.4)', brightness: 1.15 }
  },
  { 
    id: 'contrast', 
    name: 'Contrast', 
    icon: '◐', 
    category: 'foryou',
    style: { contrast: 1.4 }
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    icon: '🌅', 
    category: 'foryou',
    style: { tintColor: 'rgba(255, 120, 50, 0.35)' }
  },
  { 
    id: 'cool', 
    name: 'Cool', 
    icon: '❄️', 
    category: 'foryou',
    style: { tintColor: 'rgba(100, 150, 255, 0.3)' }
  },
  { 
    id: 'warm', 
    name: 'Warm', 
    icon: '☀️', 
    category: 'foryou',
    style: { tintColor: 'rgba(255, 150, 50, 0.3)', brightness: 1.1 }
  },
  { 
    id: 'dramatic', 
    name: 'Dramatic', 
    icon: '🎭', 
    category: 'foryou',
    style: { tintColor: 'rgba(0, 0, 0, 0.2)', contrast: 1.5 }
  },
];

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectFilter: (filter: Filter | null) => void;
  selectedFilter: Filter | null;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  visible,
  onClose,
  onSelectFilter,
  selectedFilter,
}: FilterBottomSheetProps) => {
  console.log('FilterBottomSheet visible:', visible);
  console.log('FILTERS count:', FILTERS.length);
  
  const handleSelectFilter = (filter: Filter) => {
    if (selectedFilter?.id === filter.id) {
      // Deselect if already selected
      onSelectFilter(null);
    } else {
      onSelectFilter(filter);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.bottomSheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Filter Grid */}
          <ScrollView 
            style={styles.filterScroll}
            contentContainerStyle={styles.filterGrid}
            showsVerticalScrollIndicator={false}
          >
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterItem,
                  selectedFilter?.id === filter.id && styles.filterItemSelected
                ]}
                onPress={() => handleSelectFilter(filter)}
              >
                {/* Filter Preview */}
                <View style={styles.filterPreview}>
                  <Text style={styles.filterIcon}>{filter.icon}</Text>
                  {selectedFilter?.id === filter.id && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                </View>
                
                {/* Filter Name */}
                <Text style={styles.filterName}>{filter.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    height: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Filter Grid
  filterScroll: {
    paddingTop: 16,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  filterItem: {
    width: (width - 32 - 40) / 5, // 5 items per row
    alignItems: 'center',
    marginBottom: 16,
    marginRight: 8,
  },
  filterItemSelected: {
    opacity: 1,
  },
  filterPreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterIcon: {
    fontSize: 32,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterName: {
    fontSize: 11,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
});
