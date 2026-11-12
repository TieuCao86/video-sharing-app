import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  CommonActions,
  NavigationProp,
  StackActions,
  useFocusEffect,
} from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { useDraftsStore } from '../../store/useDraftsStore';
import { deleteRecording, persistRecording } from '../../utils/persistRecording';

type PreviewRoute = RouteProp<RootStackParamList, 'RecordPreview'>;

export default function RecordPreviewScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<PreviewRoute>();
  const insets = useSafeAreaInsets();
  const { addDraft } = useDraftsStore();
  const { videoUri, durationSeconds, fileSizeBytes, audioTrackId, audioTitle } = route.params;
  const [saving, setSaving] = useState(false);
  const keptRef = useRef(false);
  const savingRef = useRef(false);

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
  });

  useFocusEffect(
    useCallback(() => {
      player.play();
      return () => player.pause();
    }, [player])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (savingRef.current) {
        event.preventDefault();
        return;
      }
      player.pause();
      if (!keptRef.current) deleteRecording(videoUri);
    });
    return unsubscribe;
  }, [navigation, player, videoUri]);

  const mins = Math.floor(durationSeconds / 60);
  const secs = Math.floor(durationSeconds % 60);
  const durationLabel = `${mins}:${secs.toString().padStart(2, '0')}`;

  const handleRetake = () => {
    if (savingRef.current) return;
    player.pause();
    keptRef.current = false;
    navigation.goBack();
  };

  const handleContinue = () => {
    keptRef.current = true;
    navigation.dispatch(
      StackActions.replace('PostVideo', {
        videoUri,
        durationSeconds,
        fileSizeBytes,
        audioTrackId,
        audioTitle,
      })
    );
  };

  const handleSaveDraft = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    player.pause();
    try {
      const savedVideoUri = await persistRecording(videoUri);
      await addDraft({
        videoUrl: savedVideoUri,
        durationSeconds,
        fileSizeBytes,
        title: 'Untitled recording',
        audioTrackId,
        audioTitle,
      });
      keptRef.current = true;
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: 'MainTabs' }, { name: 'Drafts' }],
        })
      );
    } catch (error) {
      console.error('Failed to save recording as a draft:', error);
      Alert.alert('Could not save draft', 'Your recording is still available. Please try again.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
        surfaceType={Platform.OS === 'android' ? 'textureView' : undefined}
      />

      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.iconButton} onPress={handleRetake}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.duration}>{durationLabel}</Text>
        <View style={styles.iconButton} />
      </View>

      {audioTrackId ? (
        <View style={styles.audioNote}>
          <Ionicons name="musical-notes" size={14} color="white" />
          <Text style={styles.audioNoteText}>
            {audioTitle ? `${audioTitle} is saved with this draft. It is not mixed into the file.` : 'Audio selected. It is not mixed into the file.'}
          </Text>
        </View>
      ) : null}

      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetake} disabled={saving}>
          <Text style={styles.secondaryText}>Retake</Text>
        </TouchableOpacity>
        <View style={styles.primaryActions}>
          <TouchableOpacity style={styles.draftButton} onPress={handleSaveDraft} disabled={saving}>
            <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save draft'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} disabled={saving}>
            <Text style={styles.primaryText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    zIndex: 1,
    elevation: 1,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  duration: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  audioNote: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  audioNoteText: {
    color: 'white',
    fontSize: 13,
    flex: 1,
  },
  actions: {
    position: 'absolute',
    zIndex: 1,
    elevation: 1,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  primaryActions: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF3B5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
