import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { CustomButton } from "../../components/buttons/CustomButton";
import { BrandLogo } from "../../components/common/BrandLogo";
import { loginWithEmail } from "../../services/authService";

interface LoginScreenProps {
  onLogin?: () => void;
  onNavigateToRegister?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onNavigateToRegister,
}) => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginPress = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập email và mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmail(email, password);
      if (res.success) {
        if (onLogin) {
          onLogin();
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.replace('MainTabs');
        }
      } else {
        setErrorMessage(res.message || "Đăng nhập thất bại");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Đã có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <BrandLogo width={140} height={58} />
        </View>

        <Text style={styles.title}>LOGIN</Text>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#FF2D55" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#8E8E93"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
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

        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#8E8E93"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#8E8E93"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage(null);
            }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPassword ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="#8E8E93"
            />
          </TouchableOpacity>
        </View>

        <CustomButton
          title="Login"
          onPress={handleLoginPress}
          isLoading={isLoading}
          style={styles.loginButton}
          textStyle={styles.loginButtonText}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => {
            if (onNavigateToRegister) {
              onNavigateToRegister();
            } else {
              navigation.navigate('SignUp');
            }
          }}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    letterSpacing: 1.5,
    color: "#000000",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F3",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF2D55",
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    marginTop: 8,
    backgroundColor: "#FF2D55",
    borderRadius: 10,
    height: 48,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#8E8E93",
    fontSize: 14,
  },
  linkText: {
    color: "#FF2D55",
    fontSize: 14,
    fontWeight: "bold",
  },
});
