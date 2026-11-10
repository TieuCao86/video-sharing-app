import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { CustomButton } from "../../components/buttons/CustomButton";
import { verifyOtpCode, resendOtpCode } from "../../services/authService";

interface OTPScreenProps {
  email?: string;
  onVerify?: (otp: string) => void;
}

export const OTPScreen: React.FC<OTPScreenProps> = ({
  email: propEmail,
  onVerify,
}) => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const email = route.params?.email || propEmail || "user@example.com";
  const displayName = route.params?.displayName || "";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<React.ElementRef<typeof TextInput>[]>([]);

  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    setErrorMessage(null);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer === 0 && !isResending) {
      setIsResending(true);
      setErrorMessage(null);
      try {
        const res = await resendOtpCode(email);
        if (res.success) {
          setTimer(60);
          Alert.alert("Thông báo", "Mã xác thực mới đã được gửi về email của bạn!");
        } else {
          setErrorMessage(res.message || "Gửi lại OTP thất bại.");
        }
      } catch (err: any) {
        setErrorMessage(err?.message || "Lỗi khi gửi lại OTP.");
      } finally {
        setIsResending(false);
      }
    }
  };

  const handleVerifyPress = async () => {
    const fullOtp = otp.join("").trim();
    if (fullOtp.length < 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã OTP.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (onVerify) {
        onVerify(fullOtp);
        setIsLoading(false);
        return;
      }

      const res = await verifyOtpCode(email, fullOtp, displayName);
      if (res.success) {
        Alert.alert(
          "Đăng ký thành công 🎉",
          "Tài khoản của bạn đã được kích hoạt thành công. Vui lòng đăng nhập để bắt đầu!",
          [
            {
              text: "Đăng nhập ngay",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              },
            },
          ]
        );
      } else {
        setErrorMessage(res.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Đã có lỗi xảy ra khi xác thực.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="mail-unread-outline"
              size={30}
              color="#FF2D55"
            />
          </View>
        </View>

        <Text style={styles.title}>OTP VERIFICATION</Text>

        <Text style={styles.description}>
          Mã xác thực 6 chữ số đã được gửi đến{"\n"}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        {errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#FF2D55" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) {
                  inputRefs.current[index] = ref;
                }
              }}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(val) => handleOtpChange(val, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              autoFocus={index === 0}
            />
          ))}
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Bạn chưa nhận được mã?</Text>
          {timer > 0 ? (
            <Text style={styles.timerText}>Gửi lại sau {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text style={styles.resendLink}>
                {isResending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <CustomButton
          title="XÁC THỰC"
          onPress={handleVerifyPress}
          isLoading={isLoading}
          style={styles.verifyButton}
          textStyle={styles.verifyButtonText}
        />

        <Text style={styles.footerNotice}>
          Vui lòng kiểm tra cả thư mục Spam/Rác nếu không thấy email trong Hộp thư đến.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  backButton: {
    position: "absolute",
    top: 16,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  logoContainer: { alignItems: "center", marginBottom: 16 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 1,
  },
  description: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  emailHighlight: { fontWeight: "700", color: "#000000" },
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    backgroundColor: "#FAFAFA",
  },
  otpBoxFilled: { borderColor: "#FF2D55", backgroundColor: "#FFFFFF" },
  resendContainer: { alignItems: "center", marginBottom: 24 },
  resendText: { fontSize: 14, color: "#666666" },
  timerText: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "500",
    marginTop: 4,
  },
  resendLink: {
    fontSize: 14,
    color: "#FF2D55",
    fontWeight: "700",
    marginTop: 4,
  },
  verifyButton: {
    backgroundColor: "#FF2D55",
    borderRadius: 10,
    height: 48,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  footerNotice: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 18,
  },
});
