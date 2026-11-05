import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../../constants/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger' | 'muted-outline';
  size?: 'default' | 'large'; // Thêm size để linh hoạt giữa các màn hình (large cho Auth, default cho app chung)
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  isLoading = false,
  style,
  textStyle,
  disabled = false,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'outline':
      case 'muted-outline':
        return 'transparent';
      case 'danger':
        return '#FF3B30';
      default:
        return '#FF2D55'; // Đồng bộ màu hồng/đỏ chủ đạo (#FF2D55)
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return '#FF2D55';
      case 'muted-outline':
        return '#8E8E93';
      default:
        return '#FFFFFF';
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'outline':
        return '#FF2D55';
      case 'muted-outline':
        return '#E0E0E0';
      default:
        return 'transparent';
    }
  };

  const hasBorder = variant === 'outline' || variant === 'muted-outline';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isLoading || disabled}
      style={[
        styles.button,
        size === 'large' ? styles.largeButton : styles.defaultButton,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: hasBorder ? 1 : 0,
          borderColor: getBorderColor(),
        },
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            size === 'large' ? styles.largeText : styles.defaultText,
            { color: getTextColor() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  defaultButton: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
  },
  largeButton: {
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontWeight: '600',
  },
  defaultText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
});