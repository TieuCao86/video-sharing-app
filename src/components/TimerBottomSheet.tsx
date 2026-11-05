import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type TimerOption = 3 | 5 | 10 | null;

interface TimerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectTimer: (timer: TimerOption) => void;
  selectedTimer: TimerOption;
}

const TIMER_OPTIONS: { value: TimerOption; label: string }[] = [
  { value: null, label: 'Off' },
  { value: 3, label: '3s' },
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
];

export const TimerBottomSheet: React.FC<TimerBottomSheetProps> = ({
  visible,
  onClose,
  onSelectTimer,
  selectedTimer,
}) => {
  const handleSelectTimer = (timer: TimerOption) => {
    onSelectTimer(timer);
    onClose();
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
            <Text style={styles.title}>Set timer</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Timer Options */}
          <View style={styles.tabContainer}>
            {TIMER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value?.toString() || 'off'}
                style={[
                  styles.tab,
                  selectedTimer === option.value && styles.tabActive
                ]}
                onPress={() => handleSelectTimer(option.value)}
              >
                <Text style={[
                  styles.tabText,
                  selectedTimer === option.value && styles.tabTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 8,
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    minWidth: 70,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FF2D55',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
  },
});
