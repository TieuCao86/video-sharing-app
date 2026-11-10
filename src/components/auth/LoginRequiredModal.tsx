import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { CustomButton } from '../buttons/CustomButton';

const { width } = Dimensions.get('window');

export interface LoginRequiredModalProps {
  visible?: boolean;
  onCancel?: () => void;
  onLogin?: () => void;
  title?: string;
  message?: string;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  visible,
  onCancel,
  onLogin,
  title = 'Login Required',
  message = 'Please log in to continue using this feature.',
}) => {
  const navigation = useNavigation<any>();
  const { isLoginModalVisible, hideLoginModal, isLoggedIn } = useAuthStore();

  // "Logged-in users must never see it."
  if (isLoggedIn) {
    return null;
  }

  const isVisible = visible !== undefined ? visible : isLoginModalVisible;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      hideLoginModal();
    }
  };

  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      hideLoginModal();
      navigation.navigate('Login');
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="lock-closed"
                  size={32}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              <View style={styles.buttonRow}>
                <CustomButton
                  title="Cancel"
                  variant="muted-outline"
                  onPress={handleCancel}
                  style={styles.cancelButton}
                  textStyle={styles.cancelText}
                />
                <CustomButton
                  title="Login"
                  variant="primary"
                  onPress={handleLogin}
                  style={styles.loginButton}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: Math.min(width - 48, 340),
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
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 36, 66, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: 'transparent',
  },
  cancelText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 14,
  },
  loginButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
});

