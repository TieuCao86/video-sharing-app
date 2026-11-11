import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types/navigation';
import { Topic, getTopics } from '../../services/topicService';
import { createVideoPost } from '../../services/videoService';
import { useDraftsStore } from '../../store/useDraftsStore';
import { deleteRecording, persistRecording } from '../../utils/persistRecording';

type PostRoute = RouteProp<RootStackParamList, 'PostVideo'>;
type Visibility = 'PUBLIC' | 'PRIVATE';

const AUDIENCES: { value: Visibility; label: string; detail: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'PUBLIC', label: 'Everyone', detail: 'Anyone can watch this video', icon: 'globe-outline' },
  { value: 'PRIVATE', label: 'Only you', detail: 'Only you can watch this video', icon: 'lock-closed-outline' },
];

export default function PostVideoScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<PostRoute>();
  const insets = useSafeAreaInsets();
  const { addDraft } = useDraftsStore();
  const { videoUri, durationSeconds, audioTrackId, audioTitle } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string>();
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [audiencePickerVisible, setAudiencePickerVisible] = useState(false);
  const [coverUri, setCoverUri] = useState<string>();
  const [posting, setPosting] = useState(false);
  const postingRef = useRef(false);

  const loadTopics = async () => {
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      setTopics(await getTopics());
    } catch (error) {
      console.error('Failed to load topics for video post:', error);
      setTopicsError('Could not load topics. Check your connection and try again.');
    } finally {
      setTopicsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchTopics = async () => {
      try {
        const availableTopics = await getTopics();
        if (active) setTopics(availableTopics);
      } catch (error) {
        console.error('Failed to load topics for video post:', error);
        if (active) setTopicsError('Could not load topics. Check your connection and try again.');
      } finally {
        if (active) setTopicsLoading(false);
      }
    };
    void fetchTopics();
    return () => {
      active = false;
    };
  }, []);

  const handlePickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setCoverUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to choose video cover:', error);
      Alert.alert('Could not choose a cover', 'Please try selecting the image again.');
    }
  };

  const handleSaveDraft = async () => {
    if (postingRef.current) return;
    postingRef.current = true;
    setPosting(true);
    let savedCoverUri: string | undefined;
    try {
      savedCoverUri = coverUri ? await persistRecording(coverUri) : undefined;
      await addDraft({
        videoUrl: videoUri,
        durationSeconds,
        title,
        description,
        topicId,
        visibility,
        thumbnail: savedCoverUri,
        audioTrackId,
        audioTitle,
      });
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [{ name: 'MainTabs' }, { name: 'Drafts' }],
        })
      );
    } catch (error) {
      if (savedCoverUri) deleteRecording(savedCoverUri);
      console.error('Failed to save video post as a draft:', error);
      Alert.alert('Could not save draft', 'Your recording is still available. Please try again.');
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const handlePost = async () => {
    if (postingRef.current) return;
    if (!title.trim()) {
      Alert.alert('Add a title', 'Enter a title before posting your video.');
      return;
    }

    postingRef.current = true;
    setPosting(true);
    try {
      await createVideoPost({
        videoUri,
        coverUri,
        title,
        description,
        topicId,
        visibility,
        audioTrackId,
      });
      deleteRecording(videoUri);
      if (coverUri) deleteRecording(coverUri);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    } catch (error) {
      console.error('Failed to publish video:', error);
      Alert.alert(
        'Could not post video',
        error instanceof Error ? error.message : 'Your video is still available. Please try again.'
      );
    } finally {
      postingRef.current = false;
      setPosting(false);
    }
  };

  const selectedAudience = AUDIENCES.find((item) => item.value === visibility) ?? AUDIENCES[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          disabled={posting}
        >
          <Ionicons name="chevron-back" size={25} color="#17171B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post on social</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.coverRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change video cover"
            onPress={handlePickCover}
            style={styles.cover}
            disabled={posting}
          >
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <View style={[styles.coverImage, styles.coverPlaceholder]}>
                <Ionicons name="videocam-outline" size={30} color="#fff" />
                <Text style={styles.coverPlaceholderText}>Video cover</Text>
              </View>
            )}
            <View style={styles.coverDuration}>
              <Text style={styles.coverDurationText}>
                {Math.floor(durationSeconds / 60)}:{Math.floor(durationSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.coverEdit}>
              <Ionicons name="pencil" size={13} color="#fff" />
              <Text style={styles.coverEditText}>{coverUri ? 'Edit cover' : 'Change cover'}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.coverInfo}>
            <Text style={styles.coverHeading}>Cover</Text>
            <Text style={styles.coverDescription}>
              Upload a portrait image to use as your video thumbnail.
            </Text>
            <TouchableOpacity style={styles.changeCoverButton} onPress={handlePickCover} disabled={posting}>
              <Text style={styles.changeCoverText}>Select cover</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Add a title"
            placeholderTextColor="#A0A0A8"
            maxLength={100}
            style={styles.titleInput}
            returnKeyType="next"
          />
          <Text style={styles.counter}>{title.length}/100</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Share more about your video..."
            placeholderTextColor="#A0A0A8"
            maxLength={2200}
            multiline
            textAlignVertical="top"
            style={styles.descriptionInput}
          />
          <Text style={styles.counter}>{description.length}/2200</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Topic</Text>
          {topicsLoading ? (
            <ActivityIndicator size="small" color="#FF3B5C" style={styles.topicLoading} />
          ) : topicsError ? (
            <View style={styles.topicErrorRow}>
              <Text style={styles.topicError}>{topicsError}</Text>
              <TouchableOpacity onPress={() => void loadTopics()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : topics.length ? (
            <View style={styles.topicList}>
              {topics.map((topic) => {
                const isSelected = topic.id === topicId;
                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => setTopicId(isSelected ? undefined : topic.id)}
                    style={[styles.topicChip, isSelected && styles.topicChipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    {topic.icon ? <Text style={styles.topicIcon}>{topic.icon}</Text> : null}
                    <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>{topic.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.helperText}>No topics are available right now.</Text>
          )}
        </View>

        <View style={[styles.section, styles.audienceSection]}>
          <View style={styles.audienceCopy}>
            <Text style={styles.label}>Who can watch this video</Text>
            <Text style={styles.helperText}>{selectedAudience.detail}</Text>
          </View>
          <TouchableOpacity
            style={styles.audienceButton}
            onPress={() => setAudiencePickerVisible(true)}
            disabled={posting}
          >
            <Ionicons name={selectedAudience.icon} size={18} color="#32323A" />
            <Text style={styles.audienceButtonText}>{selectedAudience.label}</Text>
            <Ionicons name="chevron-down" size={16} color="#777780" />
          </TouchableOpacity>
        </View>

        {audioTrackId ? (
          <View style={styles.audioNote}>
            <Ionicons name="musical-notes-outline" size={17} color="#62626B" />
            <Text style={styles.audioNoteText}>
              {audioTitle ? `${audioTitle} is selected but is not mixed into the video.` : 'Selected audio is not mixed into the video.'}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveDraft} disabled={posting}>
          <Text style={styles.saveButtonText}>Save draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.postButton} onPress={handlePost} disabled={posting}>
          {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
        </TouchableOpacity>
      </View>

      <Modal
        visible={audiencePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAudiencePickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAudiencePickerVisible(false)}>
          <Pressable style={styles.audienceModal} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Who can watch this video</Text>
            {AUDIENCES.map((audience) => {
              const isSelected = visibility === audience.value;
              return (
                <TouchableOpacity
                  key={audience.value}
                  style={styles.audienceOption}
                  onPress={() => {
                    setVisibility(audience.value);
                    setAudiencePickerVisible(false);
                  }}
                >
                  <Ionicons name={audience.icon} size={20} color="#32323A" />
                  <View style={styles.audienceOptionCopy}>
                    <Text style={styles.audienceOptionTitle}>{audience.label}</Text>
                    <Text style={styles.audienceOptionDetail}>{audience.detail}</Text>
                  </View>
                  <View style={[styles.radio, isSelected && styles.radioSelected]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8EC',
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#17171B',
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  coverRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  cover: {
    width: 104,
    height: 148,
    overflow: 'hidden',
    borderRadius: 10,
    backgroundColor: '#202026',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#34343C',
  },
  coverPlaceholderText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  coverDuration: {
    position: 'absolute',
    right: 7,
    top: 7,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  coverDurationText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  coverEdit: {
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  coverEditText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  coverInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  coverHeading: {
    color: '#202026',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 7,
  },
  coverDescription: {
    color: '#777780',
    fontSize: 13,
    lineHeight: 19,
  },
  changeCoverButton: {
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F3F5',
  },
  changeCoverText: {
    color: '#303038',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 23,
  },
  label: {
    color: '#25252B',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 9,
  },
  titleInput: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#202026',
    fontSize: 15,
  },
  descriptionInput: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    color: '#202026',
    fontSize: 14,
    lineHeight: 20,
  },
  counter: {
    color: '#A0A0A8',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 5,
  },
  topicLoading: {
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  topicList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  topicChipSelected: {
    borderColor: '#FF3B5C',
    backgroundColor: '#FFF1F3',
  },
  topicIcon: {
    fontSize: 13,
  },
  topicText: {
    color: '#55555E',
    fontSize: 13,
  },
  topicTextSelected: {
    color: '#D92748',
    fontWeight: '600',
  },
  topicErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  topicError: {
    flex: 1,
    color: '#A34B55',
    fontSize: 12,
  },
  retryText: {
    color: '#D92748',
    fontSize: 13,
    fontWeight: '600',
  },
  audienceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingTop: 17,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8EC',
  },
  audienceCopy: {
    flex: 1,
  },
  helperText: {
    color: '#85858E',
    fontSize: 12,
    lineHeight: 18,
  },
  audienceButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 7,
  },
  audienceButtonText: {
    color: '#32323A',
    fontSize: 12,
    fontWeight: '600',
  },
  audioNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },
  audioNoteText: {
    flex: 1,
    color: '#62626B',
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8E8EC',
    backgroundColor: '#fff',
  },
  saveButton: {
    height: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5D5DA',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#28282F',
    fontSize: 14,
    fontWeight: '600',
  },
  postButton: {
    height: 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FF3B5C',
  },
  postButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  audienceModal: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#fff',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    marginBottom: 18,
    borderRadius: 2,
    backgroundColor: '#D5D5DA',
  },
  modalTitle: {
    marginBottom: 10,
    color: '#202026',
    fontSize: 17,
    fontWeight: '700',
  },
  audienceOption: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8EC',
  },
  audienceOptionCopy: {
    flex: 1,
  },
  audienceOptionTitle: {
    color: '#25252B',
    fontSize: 14,
    fontWeight: '600',
  },
  audienceOptionDetail: {
    marginTop: 3,
    color: '#85858E',
    fontSize: 12,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#C8C8CE',
    borderRadius: 10,
  },
  radioSelected: {
    borderColor: '#FF3B5C',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B5C',
  },
});
