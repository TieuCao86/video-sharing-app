import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { Avatar } from '../../components/common/Avatar';
import { CustomButton } from '../../components/buttons/CustomButton';
import { useAuthStore, DEFAULT_USER } from '../../store/useAuthStore';

const MAX_BIO_LENGTH = 150;
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, updateProfile } = useAuthStore();

  const currentUser = route.params?.user || user || DEFAULT_USER;

  const [avatarUri, setAvatarUri] = useState<string>(currentUser.avatar || '');
  const [displayName, setDisplayName] = useState<string>(currentUser.name || '');
  const [bio, setBio] = useState<string>(currentUser.bio || '');

  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickAvatar = async () => {
    setAvatarError(null);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setAvatarError('Permission to access photos is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Format validation: accept only JPG/PNG
        const fileName = asset.fileName || asset.uri.split('?')[0].split('/').pop() || '';
        const mimeType = asset.mimeType || '';
        const isJpgOrPng =
          mimeType === 'image/jpeg' ||
          mimeType === 'image/png' ||
          /\.(jpe?g|png)$/i.test(fileName) ||
          /\.(jpe?g|png)$/i.test(asset.uri);

        if (!isJpgOrPng) {
          setAvatarError('Invalid format. Only JPG and PNG are accepted.');
          return;
        }

        // File size validation: max 5 MB
        if (asset.fileSize && asset.fileSize > MAX_AVATAR_SIZE_BYTES) {
          setAvatarError('File is too large. Maximum size is 5 MB.');
          return;
        }

        setAvatarUri(asset.uri);
      }
    } catch (err: any) {
      setAvatarError(err?.message || 'Failed to select image.');
    }
  };

  const handleSave = () => {
    let valid = true;
    const trimmedName = displayName.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setNameError('Display name must be between 2 and 50 characters.');
      valid = false;
    } else {
      setNameError(null);
    }

    if (bio.length > MAX_BIO_LENGTH) {
      setBioError(`Bio cannot exceed ${MAX_BIO_LENGTH} characters.`);
      valid = false;
    } else {
      setBioError(null);
    }

    if (!valid) return;

    setIsSaving(true);
    updateProfile({
      name: trimmedName,
      bio: bio.trim(),
      avatar: avatarUri,
    });

    if (route.params?.onSave) {
      route.params.onSave({
        name: trimmedName,
        bio: bio.trim(),
        avatar: avatarUri,
      });
    }

    setIsSaving(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Avatar
                uri={avatarUri}
                size={100}
                ringColor={colors.primary}
                ringWidth={2}
                ringGap={3}
              />
              <TouchableOpacity
                style={styles.changeAvatarBadge}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={handlePickAvatar}
              activeOpacity={0.7}
              style={styles.changeAvatarButton}
            >
              <Text style={styles.changeAvatarText}>Change Avatar</Text>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>JPG or PNG, max 5 MB</Text>
            {avatarError && (
              <Text style={styles.errorText}>{avatarError}</Text>
            )}
          </View>

          {/* Display Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <View
              style={[
                styles.inputWrapper,
                nameError ? styles.inputErrorBorder : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  if (text.trim().length >= 2 && text.trim().length <= 50) {
                    setNameError(null);
                  }
                }}
                placeholder="Enter display name"
                placeholderTextColor={colors.textMuted}
                maxLength={60}
              />
            </View>
            <View style={styles.fieldFooter}>
              <Text style={styles.helperText}>2–50 characters</Text>
            </View>
            {nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </View>

          {/* Bio Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Bio</Text>
            <View
              style={[
                styles.inputWrapper,
                styles.bioWrapper,
                bioError ? styles.inputErrorBorder : null,
              ]}
            >
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={bio}
                onChangeText={(text) => {
                  setBio(text);
                  if (text.length <= MAX_BIO_LENGTH) {
                    setBioError(null);
                  }
                }}
                placeholder="Add a bio to your profile..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={MAX_BIO_LENGTH}
              />
            </View>
            <View style={styles.fieldFooter}>
              <View />
              <Text style={styles.charCounter}>
                {bio.length}/{MAX_BIO_LENGTH}
              </Text>
            </View>
            {bioError && <Text style={styles.errorText}>{bioError}</Text>}
          </View>

          {/* Save Button */}
          <CustomButton
            title="Save"
            onPress={handleSave}
            size="large"
            isLoading={isSaving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
  },
  changeAvatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changeAvatarButton: {
    marginTop: 10,
  },
  changeAvatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  avatarHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bioWrapper: {
    height: 110,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  textInput: {
    fontSize: 15,
    color: colors.text,
  },
  bioInput: {
    height: '100%',
    textAlignVertical: 'top',
  },
  inputErrorBorder: {
    borderColor: '#FF3B30',
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  charCounter: {
    fontSize: 12,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  saveButton: {
    marginTop: 16,
  },
});

