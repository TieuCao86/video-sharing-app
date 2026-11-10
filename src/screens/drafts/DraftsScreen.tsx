import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { CustomButton } from '../../components/buttons/CustomButton';

export interface DraftItem {
  id: string;
  thumbnail: string;
  title: string;
  updatedAt: string;
  duration?: string;
}

const INITIAL_DRAFTS: DraftItem[] = [
  {
    id: 'draft-1',
    thumbnail: 'https://picsum.photos/seed/draft1/300/400',
    title: 'Summer dance routine',
    updatedAt: '2 hours ago',
    duration: '0:15',
  },
  {
    id: 'draft-2',
    thumbnail: 'https://picsum.photos/seed/draft2/300/400',
    title: 'Cooking recipe tutorial',
    updatedAt: 'Yesterday',
    duration: '0:30',
  },
  {
    id: 'draft-3',
    thumbnail: 'https://picsum.photos/seed/draft3/300/400',
    title: 'Travel memories preview',
    updatedAt: '3 days ago',
    duration: '0:45',
  },
  {
    id: 'draft-4',
    thumbnail: 'https://picsum.photos/seed/draft4/300/400',
    title: 'Sunset timelapse draft',
    updatedAt: 'Last week',
    duration: '0:20',
  },
  {
    id: 'draft-5',
    thumbnail: 'https://picsum.photos/seed/draft5/300/400',
    title: 'Guitar chord practice',
    updatedAt: '2 weeks ago',
    duration: '1:00',
  },
  {
    id: 'draft-6',
    thumbnail: 'https://picsum.photos/seed/draft6/300/400',
    title: 'Cat play highlights',
    updatedAt: '3 weeks ago',
    duration: '0:18',
  },
];

export const DraftsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [drafts, setDrafts] = useState<DraftItem[]>(INITIAL_DRAFTS);
  const [draftToDelete, setDraftToDelete] = useState<DraftItem | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftItem | null>(null);

  // Request deletion confirmation
  const handleDeletePress = (draft: DraftItem) => {
    setDraftToDelete(draft);

    // Also trigger native Alert for environments that expect Alert.alert
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

  const confirmDelete = (draftId: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
    setDraftToDelete(null);
    if (selectedDraft?.id === draftId) {
      setSelectedDraft(null);
    }
  };

  const handleCancelDelete = () => {
    setDraftToDelete(null);
  };

  const renderDraftItem = ({ item }: { item: DraftItem }) => {
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => setSelectedDraft(item)}
        >
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />

          {/* Draft Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Draft</Text>
          </View>

          {/* Duration Badge */}
          {item.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          )}

          {/* Card Info Overlay */}
          <View style={styles.cardFooter}>
            <Text style={styles.draftTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.draftTime}>{item.updatedAt}</Text>
          </View>
        </TouchableOpacity>

        {/* Clearly Visible Delete Button on Every Draft Card */}
        <TouchableOpacity
          style={styles.cardDeleteButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Delete draft ${item.title}`}
          onPress={() => handleDeletePress(item)}
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Drafts</Text>
        <View style={styles.headerRight}>
          {drafts.length > 0 && (
            <Text style={styles.countBadge}>{drafts.length}</Text>
          )}
        </View>
      </View>

      {/* Main Content */}
      {drafts.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.textMuted}
            />
          </View>
          <Text style={styles.emptyTitle}>No Drafts Yet</Text>
          <Text style={styles.emptySubtitle}>
            Videos you save as drafts will appear here.
          </Text>
        </View>
      ) : (
        /* Drafts Grid */
        <FlatList
          data={drafts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderDraftItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Draft Detail / Preview Modal */}
      <Modal
        visible={!!selectedDraft}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDraft(null)}
      >
        <View style={styles.previewOverlay}>
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewHeaderTitle} numberOfLines={1}>
                {selectedDraft?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedDraft(null)}
                style={styles.previewCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedDraft && (
              <View style={styles.previewBody}>
                <Image
                  source={{ uri: selectedDraft.thumbnail }}
                  style={styles.previewImage}
                />
                <View style={styles.previewInfoRow}>
                  <Text style={styles.previewInfoLabel}>Last updated:</Text>
                  <Text style={styles.previewInfoValue}>
                    {selectedDraft.updatedAt}
                  </Text>
                </View>
                {selectedDraft.duration && (
                  <View style={styles.previewInfoRow}>
                    <Text style={styles.previewInfoLabel}>Duration:</Text>
                    <Text style={styles.previewInfoValue}>
                      {selectedDraft.duration}
                    </Text>
                  </View>
                )}

                {/* Visible Delete Action in Detail/Preview */}
                <TouchableOpacity
                  style={styles.previewDeleteButton}
                  activeOpacity={0.7}
                  onPress={() => handleDeletePress(selectedDraft)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  <Text style={styles.previewDeleteText}>Delete Draft</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Dialog Modal */}
      <Modal
        visible={!!draftToDelete}
        transparent
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <TouchableWithoutFeedback onPress={handleCancelDelete}>
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
                    onPress={handleCancelDelete}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerRight: {
    minWidth: 28,
    alignItems: 'flex-end',
  },
  countBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  listContent: {
    padding: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardContainer: {
    width: '48.5%',
    position: 'relative',
  },
  card: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  durationBadge: {
    position: 'absolute',
    top: 8,
    right: 44, // Beside delete button
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  cardDeleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  cardFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  draftTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  draftTime: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Preview Modal
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  previewContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  previewHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    marginRight: 16,
  },
  previewCloseButton: {
    padding: 4,
  },
  previewBody: {
    padding: 20,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  previewInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  previewInfoLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  previewInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  previewDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginTop: 20,
    gap: 8,
  },
  previewDeleteText: {
    color: '#FF3B30',
    fontSize: 16,
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
