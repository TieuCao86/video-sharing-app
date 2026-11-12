import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DraftItem, useDraftsStore } from '../../store/useDraftsStore';
import { DraftVideoItem } from './DraftVideoItem';
import { CustomButton } from '../../components/buttons/CustomButton';
import { colors } from '../../constants/colors';

const { height } = Dimensions.get('window');

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 50,
};

interface DraftViewerProps {
  initialDraftId: string;
  onClose: () => void;
  draftItems?: DraftItem[];
}

export const DraftViewer: React.FC<DraftViewerProps> = ({
  initialDraftId,
  onClose,
  draftItems,
}) => {
  const insets = useSafeAreaInsets();
  const { drafts: localDrafts, deleteDraft } = useDraftsStore();
  const drafts = draftItems ?? localDrafts;
  const flatListRef = useRef<FlatList<DraftItem>>(null);

  // Find initial index
  const initialIndex = drafts.findIndex((d) => d.id === initialDraftId);
  const startIndex = initialIndex !== -1 ? initialIndex : 0;

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [draftToDelete, setDraftToDelete] = useState<DraftItem | null>(null);

  // Scroll to initial draft on mount
  useEffect(() => {
    if (flatListRef.current && startIndex > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: startIndex,
          animated: false,
        });
      }, 50);
    }
  }, [startIndex]);

  // Handle vertical paging viewability
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      if (idx !== null && idx !== undefined) {
        setCurrentIndex(idx);
      }
    }
  }, []);

  // Delete Action
  const handleDeletePress = (draft: DraftItem) => {
    setDraftToDelete(draft);

    // Also trigger native Alert for native dialog confirmation
    Alert.alert(
      'Delete draft?',
      "Delete this draft? This can't be undone.",
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setDraftToDelete(null),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDelete(draft.id),
        },
      ],
      { cancelable: true }
    );
  };

  const confirmDelete = (id: string) => {
    const remainingCount = drafts.length - 1;
    deleteDraft(id);
    setDraftToDelete(null);

    if (remainingCount <= 0) {
      // No drafts left: return to S21
      onClose();
    } else {
      // Move to next available draft
      if (currentIndex >= remainingCount) {
        setCurrentIndex(Math.max(0, remainingCount - 1));
      }
    }
  };

  // Publish Action
  const handlePublishPress = (_draft: DraftItem) => {
    Alert.alert('Tính năng đang được phát triển', 'Chức năng Publish bản nháp sẽ sớm được hỗ trợ.');
  };

  const renderDraftItem = ({ item, index }: { item: DraftItem; index: number }) => (
    <DraftVideoItem
      draft={item}
      isActive={index === currentIndex && !draftToDelete}
      onDelete={handleDeletePress}
      onPublish={handlePublishPress}
    />
  );

  return (
    <View style={styles.container}>
      {/* Vertical Swiping FlatList - Exact same structure as feed */}
      <FlatList
        ref={flatListRef}
        data={drafts}
        renderItem={renderDraftItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={VIEWABILITY_CONFIG}
        getItemLayout={(_data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
      />

      {/* Back Arrow Button Overlay (Top-Left, respecting Safe Area) */}
      <View
        style={[
          styles.backButtonContainer,
          { top: Math.max(insets.top, 16) },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Back to Drafts"
        >
          <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Dialog Modal */}
      <Modal
        visible={!!draftToDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setDraftToDelete(null)}
      >
        <TouchableWithoutFeedback onPress={() => setDraftToDelete(null)}>
          <View style={styles.dialogOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogCard}>
                <View style={styles.dialogIconCircle}>
                  <Ionicons name="trash" size={32} color="#FF3B30" />
                </View>
                <Text style={styles.dialogTitle}>Delete draft?</Text>
                <Text style={styles.dialogMessage}>
                  {"Delete this draft? This can't be undone."}
                </Text>
                <View style={styles.dialogButtonRow}>
                  <CustomButton
                    title="Cancel"
                    variant="muted-outline"
                    onPress={() => setDraftToDelete(null)}
                    style={styles.dialogCancelButton}
                    textStyle={styles.dialogCancelText}
                  />
                  <CustomButton
                    title="Delete"
                    variant="danger"
                    onPress={() =>
                      draftToDelete && confirmDelete(draftToDelete.id)
                    }
                    style={styles.dialogDeleteButton}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Confirmation Dialog
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  dialogButtonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  dialogCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: 'transparent',
  },
  dialogCancelText: {
    color: '#666666',
    fontWeight: '600',
  },
  dialogDeleteButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
  },
});