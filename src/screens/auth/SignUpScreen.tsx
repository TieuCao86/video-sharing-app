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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CustomButton } from '../../components/buttons/CustomButton';
import { BrandLogo } from '../../components/common/BrandLogo';
import { signUpWithEmail } from '../../services/authService';

interface SignUpScreenProps {
  onSignUp?: () => void;
  onNavigateToLogin?: () => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onSignUp,
  onNavigateToLogin,
}) => {
  const navigation = useNavigation<any>();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignUpPress = async () => {
    setErrorMessage(null);

    if (displayName.trim().length < 2 || displayName.trim().length > 50) {
      setErrorMessage('Tên hiển thị phải từ 2 đến 50 ký tự');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Email');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu tối thiểu phải 6 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithEmail(displayName, email, password);
      if (res.success) {
        // Chuyển sang giao diện OTP kèm thông tin email
        navigation.navigate('OTP', {
          email: email.trim(),
          displayName: displayName.trim(),
        });
      } else {
        setErrorMessage(res.message || 'Đăng ký thất bại');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Đã có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <BrandLogo width={140} height={58} />
          </View>

          <Text style={styles.title}>SIGN UP</Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#FF2D55" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Display Name"
                placeholderTextColor="#8E8E93"
                value={displayName}
                onChangeText={(text) => {
                  setDisplayName(text);
                  setErrorMessage(null);
                }}
              />
            </View>
            <Text style={styles.helperText}>*2–50 characters*</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#8E8E93"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setErrorMessage(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8E8E93"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#8E8E93"
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>*At least 6 characters*</Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#8E8E93"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setErrorMessage(null);
                }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#8E8E93"
                />
              </TouchableOpacity>
            </View>
          </View>

          <CustomButton
            title="Sign Up"
            onPress={handleSignUpPress}
            isLoading={isLoading}
            style={styles.signUpButton}
            textStyle={styles.signUpButtonText}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => {
              if (onNavigateToLogin) {
                onNavigateToLogin();
              } else if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Login');
              }
            }}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 1.5,
    color: '#000000',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F3',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF2D55',
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  eyeIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    marginLeft: 4,
  },
  signUpButton: {
    marginTop: 12,
    backgroundColor: '#FF2D55',
    borderRadius: 10,
    height: 48,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  linkText: {
    color: '#FF2D55',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
