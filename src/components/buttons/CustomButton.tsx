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
  isLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
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
        return colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'muted-outline':
        return colors.textSecondary;
      default:
        return colors.white;
    }
  };

  const getBorderColor = () => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      case 'muted-outline':
        return colors.borderDark;
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
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: hasBorder ? 1 : 0,
          borderColor: getBorderColor(),
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
