import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useDraftsStore, DraftItem } from '../../store/useDraftsStore';
import { DraftViewer } from './DraftViewer';
import { useAuthStore } from '../../store/useAuthStore';
import { getUserDrafts } from '../../services/videoService';

export const DraftsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user: authUser } = useAuthStore();
  const { drafts: localDrafts } = useDraftsStore();

  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [remoteDrafts, setRemoteDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrafts = useCallback(async (isRefresh = false) => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await getUserDrafts(authUser.id);

      // Chuyển VideoDetailItem → DraftItem format
      const mapped: DraftItem[] = data.map((v) => ({
        id: v.id,
        thumbnail: v.coverUrl || '',
        title: v.title || v.caption || 'Untitled draft',
        updatedAt: formatRelativeTime(v.createdAt),
        videoUrl: v.videoUrl || '',
      }));

      setRemoteDrafts(mapped);
    } catch (err) {
      console.error('Error loading drafts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  // Merge local store drafts (vừa tạo chưa sync) + remote drafts từ Supabase
  const allDrafts: DraftItem[] = [
    ...localDrafts.filter((ld) => !remoteDrafts.some((rd) => rd.id === ld.id)),
    ...remoteDrafts,
  ];

  const activeDraft = allDrafts.find((d) => d.id === activeDraftId);

  // If Draft Viewer is open, render the full-screen TikTok-style viewer
  if (activeDraftId && activeDraft) {
    return (
      <DraftViewer
        initialDraftId={activeDraftId}
        onClose={() => setActiveDraftId(null)}
      />
    );
  }

  const renderDraftItem = ({ item }: { item: DraftItem }) => {
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => setActiveDraftId(item.id)}
          accessibilityRole="button"
          accessibilityLabel={`Open draft ${item.title}`}
        >
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailFallback}>
              <Ionicons name="videocam" size={36} color="#FFFFFF" />
            </View>
          )}

          {/* Draft Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Draft</Text>
          </View>

          {/* Duration Badge */}
          {item.duration ? (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          ) : null}

          {/* Card Info Overlay */}
          <View style={styles.cardFooter}>
            <Text style={styles.draftTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.draftTime}>{item.updatedAt}</Text>
          </View>
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
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Drafts</Text>
        <View style={styles.headerRight}>
          {allDrafts.length > 0 && (
            <Text style={styles.countBadge}>{allDrafts.length}</Text>
          )}
        </View>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : allDrafts.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="document-text-outline"
              size={48}
              color={colors.textMuted}
            />
          </View>
          <Text style={styles.emptyTitle}>No drafts yet</Text>
          <Text style={styles.emptySubtitle}>
            Videos you save as drafts will appear here.
          </Text>
        </View>
      ) : (
        /* Drafts Grid */
        <FlatList
          data={allDrafts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderDraftItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchDrafts(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

/** Chuyển ISO date string thành relative time */
function formatRelativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(iso).toLocaleDateString();
}

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
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
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
    right: 8,
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
});
