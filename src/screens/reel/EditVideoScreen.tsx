import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

import { RootStackParamList } from '../../types/navigation';
import { Topic, getTopics } from '../../services/topicService';
import { updateVideoInfo } from '../../services/videoService';
import { useAuthStore } from '../../store/useAuthStore';

type EditVideoRoute = RouteProp<RootStackParamList, 'EditVideo'>;
type Visibility = 'PUBLIC' | 'PRIVATE';

const AUDIENCES: {
  value: Visibility;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: 'PUBLIC',
    label: 'Mọi người',
    detail: 'Ai cũng có thể xem video này',
    icon: 'globe-outline',
  },
  {
    value: 'PRIVATE',
    label: 'Chỉ mình tôi',
    detail: 'Chỉ bạn mới có thể xem video này',
    icon: 'lock-closed-outline',
  },
];

export default function EditVideoScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<EditVideoRoute>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const { videoId, title: initTitle, description: initDescription, hashtags: initHashtags, topicId: initTopicId, visibility: initVisibility } = route.params;

  const [title, setTitle] = useState(initTitle);
  const [description, setDescription] = useState(initDescription);
  const [hashtagsInput, setHashtagsInput] = useState(initHashtags);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | undefined>(initTopicId);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<Visibility>(
    initVisibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
  );
  const [audiencePickerVisible, setAudiencePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const loadTopics = async () => {
    setTopicsLoading(true);
    setTopicsError(null);
    try {
      setTopics(await getTopics());
    } catch {
      setTopicsError('Không thể tải danh sách chủ đề. Kiểm tra kết nối và thử lại.');
    } finally {
      setTopicsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getTopics()
      .then((data) => { if (active) setTopics(data); })
      .catch(() => { if (active) setTopicsError('Không thể tải chủ đề. Thử lại.'); })
      .finally(() => { if (active) setTopicsLoading(false); });
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (savingRef.current) return;
    if (!title.trim() || title.trim().length > 100) {
      Alert.alert('Tiêu đề không hợp lệ', 'Nhập tiêu đề từ 1 đến 100 ký tự.');
      return;
    }
    if (description.length > 500) {
      Alert.alert('Mô tả quá dài', 'Mô tả tối đa 500 ký tự.');
      return;
    }

    const hashtags = hashtagsInput
      .split(/[\s,]+/)
      .filter(Boolean)
      .map((tag) => tag.replace(/^#/, ''));

    if (
      hashtags.length > 10 ||
      hashtags.some((tag) => !/^[A-Za-z0-9_]{1,30}$/.test(tag))
    ) {
      Alert.alert('Hashtag không hợp lệ', 'Tối đa 10 hashtag, mỗi cái từ 1-30 ký tự chữ, số hoặc gạch dưới.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Lỗi', 'Vui lòng đăng nhập lại.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      await updateVideoInfo(videoId, user.id, {
        title: title.trim(),
        description,
        hashtags,
        topicId,
        visibility,
      });
      Alert.alert('Thành công', 'Thông tin video đã được cập nhật.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert(
        'Không thể lưu',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const selectedAudience =
    AUDIENCES.find((item) => item.value === visibility) ?? AUDIENCES[0];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          disabled={saving}
        >
          <Ionicons name="chevron-back" size={25} color="#17171B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa video</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Lưu thay đổi"
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FF3B5C" />
          ) : (
            <Text style={styles.headerSave}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Tiêu đề</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Nhập tiêu đề"
            placeholderTextColor="#A0A0A8"
            maxLength={100}
            style={styles.titleInput}
            returnKeyType="next"
            editable={!saving}
          />
          <Text style={styles.counter}>{title.length}/100</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Thêm mô tả cho video..."
            placeholderTextColor="#A0A0A8"
            maxLength={500}
            multiline
            textAlignVertical="top"
            style={styles.descriptionInput}
            editable={!saving}
          />
          <Text style={styles.counter}>{description.length}/500</Text>
        </View>

        {/* Hashtags */}
        <View style={styles.section}>
          <Text style={styles.label}>Hashtag</Text>
          <TextInput
            value={hashtagsInput}
            onChangeText={setHashtagsInput}
            placeholder="#travel #daily_1 (tối đa 10)"
            placeholderTextColor="#A0A0A8"
            autoCapitalize="none"
            style={styles.titleInput}
            editable={!saving}
          />
          <Text style={styles.counter}>Phân cách các hashtag bằng dấu cách hoặc dấu phẩy</Text>
        </View>

        {/* Topic */}
        <View style={styles.section}>
          <Text style={styles.label}>Chủ đề</Text>
          {topicsLoading ? (
            <ActivityIndicator size="small" color="#FF3B5C" style={styles.topicLoading} />
          ) : topicsError ? (
            <View style={styles.topicErrorRow}>
              <Text style={styles.topicError}>{topicsError}</Text>
              <TouchableOpacity onPress={() => void loadTopics()}>
                <Text style={styles.retryText}>Thử lại</Text>
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
                    disabled={saving}
                  >
                    {topic.icon ? <Text style={styles.topicIcon}>{topic.icon}</Text> : null}
                    <Text style={[styles.topicText, isSelected && styles.topicTextSelected]}>
                      {topic.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.helperText}>Không có chủ đề nào.</Text>
          )}
        </View>

        {/* Audience */}
        <View style={[styles.section, styles.audienceSection]}>
          <View style={styles.audienceCopy}>
            <Text style={styles.label}>Ai được xem video</Text>
            <Text style={styles.helperText}>{selectedAudience.detail}</Text>
          </View>
          <TouchableOpacity
            style={styles.audienceButton}
            onPress={() => setAudiencePickerVisible(true)}
            disabled={saving}
          >
            <Ionicons name={selectedAudience.icon} size={18} color="#32323A" />
            <Text style={styles.audienceButtonText}>{selectedAudience.label}</Text>
            <Ionicons name="chevron-down" size={16} color="#777780" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Audience Picker Modal */}
      <Modal
        visible={audiencePickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAudiencePickerVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setAudiencePickerVisible(false)}
        >
          <Pressable
            style={styles.audienceModal}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ai được xem video</Text>
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
    width: 52,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#17171B',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSave: {
    color: '#FF3B5C',
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
