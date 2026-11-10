import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type SortOption = 'relevance' | 'views' | 'likes' | 'latest';
export type DateOption = 'all' | 'today' | 'week' | 'month';

export interface FilterState {
  sortBy: SortOption;
  dateOption: DateOption;
}

interface SearchFilterModalProps {
  visible: boolean;
  currentFilters: FilterState;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

const SORT_OPTIONS: { id: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'relevance', label: 'Relevance', icon: 'sparkles-outline' },
  { id: 'views', label: 'Most Viewed', icon: 'eye-outline' },
  { id: 'likes', label: 'Most Liked', icon: 'heart-outline' },
  { id: 'latest', label: 'Latest', icon: 'time-outline' },
];

const DATE_OPTIONS: { id: DateOption; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today (24h)' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  visible,
  currentFilters,
  onClose,
  onApply,
}) => {
  const [selectedSort, setSelectedSort] = useState<SortOption>(currentFilters.sortBy);
  const [selectedDate, setSelectedDate] = useState<DateOption>(currentFilters.dateOption);


  const handleReset = () => {
    setSelectedSort('relevance');
    setSelectedDate('all');
  };

  const handleApply = () => {
    onApply({
      sortBy: selectedSort,
      dateOption: selectedDate,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Search Filters</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close" size={22} color="#333" />
                </TouchableOpacity>
              </View>

              {/* Sort By Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sort By</Text>
                <View style={styles.optionsList}>
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = selectedSort === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                        onPress={() => setSelectedSort(opt.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionLeft}>
                          <Ionicons
                            name={opt.icon}
                            size={18}
                            color={isSelected ? '#FF2D55' : '#666'}
                            style={{ marginRight: 10 }}
                          />
                          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                            {opt.label}
                          </Text>
                        </View>
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Date Posted Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date Posted</Text>
                <View style={styles.chipsContainer}>
                  {DATE_OPTIONS.map((opt) => {
                    const isSelected = selectedDate === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setSelectedDate(opt.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleApply}
                  activeOpacity={0.8}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  optionRowSelected: {
    backgroundColor: '#FFF0F3',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FF2D55',
    fontWeight: '600',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FF2D55',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF2D55',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  chipSelected: {
    backgroundColor: '#FF2D55',
  },
  chipText: {
    fontSize: 13,
    color: '#555555',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555555',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF2D55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
