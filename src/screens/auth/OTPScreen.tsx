import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CustomButton } from "../../components/buttons/CustomButton";

interface OTPScreenProps {
  email?: string;
  onVerify?: (otp: string) => void;
}

export const OTPScreen: React.FC<OTPScreenProps> = ({
  email = "user@example.com",
  onVerify,
}) => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  // Khai báo rõ kiểu TextInput để gọi được .focus()
  const inputRefs = useRef<React.ElementRef<typeof TextInput>[]>([]);

  useEffect(() => {
    // Dùng ReturnType thay cho NodeJS.Timeout để tránh lỗi Namespace
    let interval: ReturnType<typeof setTimeout>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
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

  const handleResend = () => {
    if (timer === 0) {
      setTimer(60);
    }
  };

  const handleVerifyPress = () => {
    const fullOtp = otp.join("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (onVerify) onVerify(fullOtp);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons
              name="play"
              size={28}
              color="#FF2D55"
              style={{ marginLeft: 3 }}
            />
          </View>
        </View>

        <Text style={styles.title}>OTP VERIFICATION</Text>

        <Text style={styles.description}>
          A 6-digit verification code has been sent to{"\n"}
          <Text style={styles.emailHighlight}>{email}</Text>. Please enter it
          below.
        </Text>

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
            />
          ))}
        </View>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        <CustomButton
          title="VERIFY"
          onPress={handleVerifyPress}
          size="large"
          isLoading={isLoading}
        />

        <Text style={styles.footerNotice}>
          Ensure you use the code before it expires.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: "#FF2D55",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#000000",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#555555",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  emailHighlight: { fontWeight: "600", color: "#111111" },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  otpBox: {
    width: 46,
    height: 52,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    backgroundColor: "#F8F8FA",
  },
  otpBoxFilled: { borderColor: "#FF2D55", backgroundColor: "#FFFFFF" },
  resendContainer: { alignItems: "center", marginBottom: 28 },
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
    fontWeight: "600",
    marginTop: 4,
  },
  footerNotice: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 16,
  },
});
