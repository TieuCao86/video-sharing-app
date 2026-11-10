import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { CustomButton } from '../../components/buttons/CustomButton';
import { supabase } from '../../utils/supabase';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [currentError, setCurrentError] = useState<string | null>(null);
  const [newError, setNewError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdatePassword = async () => {
    let valid = true;
    setCurrentError(null);
    setNewError(null);
    setConfirmError(null);
    setSuccessMessage(null);

    if (!currentPassword.trim()) {
      setCurrentError('Current password is required.');
      valid = false;
    }

    if (!newPassword) {
      setNewError('New password is required.');
      valid = false;
    } else if (newPassword.length < 6) {
      setNewError('New password must be at least 6 characters.');
      valid = false;
    } else if (newPassword === currentPassword) {
      setNewError('New password must be different from the current password.');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password.');
      valid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('New password and confirmation do not match.');
      valid = false;
    }

    if (!valid) return;

    setIsUpdating(true);
    try {
      // 1. Lấy email của tài khoản đang đăng nhập
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      if (!email) {
        setCurrentError('Bạn cần đăng nhập để đổi mật khẩu.');
        return;
      }

      // 2. Xác thực mật khẩu hiện tại
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setCurrentError('Current password is incorrect.');
        return;
      }

      // 3. Cập nhật mật khẩu mới
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('[changePassword]', updateError);
        setNewError(updateError.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.');
        return;
      }

      setSuccessMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('Success', 'Password updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('[changePassword] exception:', err);
      setNewError(err?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
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
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {successMessage && (
            <View style={styles.successBanner}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#34C759"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Current Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Current Password</Text>
            <View
              style={[
                styles.inputWrapper,
                currentError ? styles.inputErrorBorder : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (text.trim()) setCurrentError(null);
                }}
                placeholder="Enter current password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showCurrent}
              />
              <TouchableOpacity
                onPress={() => setShowCurrent(!showCurrent)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showCurrent ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {currentError && (
              <Text style={styles.errorText}>{currentError}</Text>
            )}
          </View>

          {/* New Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>New Password</Text>
            <View
              style={[
                styles.inputWrapper,
                newError ? styles.inputErrorBorder : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (text.length >= 6) setNewError(null);
                }}
                placeholder="Enter new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showNew}
              />
              <TouchableOpacity
                onPress={() => setShowNew(!showNew)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showNew ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>At least 6 characters</Text>
            {newError && <Text style={styles.errorText}>{newError}</Text>}
          </View>

          {/* Confirm New Password Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <View
              style={[
                styles.inputWrapper,
                confirmError ? styles.inputErrorBorder : null,
              ]}
            >
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (text === newPassword) setConfirmError(null);
                }}
                placeholder="Confirm new password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity
                onPress={() => setShowConfirm(!showConfirm)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
            {confirmError && (
              <Text style={styles.errorText}>{confirmError}</Text>
            )}
          </View>

          {/* Update Password Button */}
          <CustomButton
            title="Update Password"
            onPress={handleUpdatePassword}
            size="large"
            isLoading={isUpdating}
            style={styles.updateButton}
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
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F9EE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    color: '#28A745',
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  inputErrorBorder: {
    borderColor: '#FF3B30',
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  updateButton: {
    marginTop: 16,
  },
});

