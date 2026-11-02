import React, { useState } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';

interface AvatarProps {
  uri: string;
  size?: number;
  ringColor?: string;
  ringWidth?: number;
  ringGap?: number;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 48,
  ringColor,
  ringWidth = 2,
  ringGap = 2,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const imageSize = ringColor ? size - (ringWidth + ringGap) * 2 : size;

  const content = (
    <Image
      source={{ uri: hasError || !uri ? 'https://picsum.photos/200' : uri }}
      style={[
        styles.image,
        {
          width: imageSize,
          height: imageSize,
          borderRadius: imageSize / 2,
        },
      ]}
      onError={() => setHasError(true)}
    />
  );

  if (!ringColor) {
    return <View style={style}>{content}</View>;
  }

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderColor: ringColor,
        },
        style,
      ]}
    >
      <View
        style={{
          width: size - ringWidth * 2,
          height: size - ringWidth * 2,
          borderRadius: (size - ringWidth * 2) / 2,
          backgroundColor: colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {content}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: '#EFEFEF',
    resizeMode: 'cover',
  },
});

