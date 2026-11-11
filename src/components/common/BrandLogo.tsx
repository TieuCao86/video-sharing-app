import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface BrandLogoProps {
  width: number;
  height: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ width, height }) => (
  <Image
    source={require('../../../assets/8T-logo.png')}
    style={[styles.logo, { width, height }]}
    resizeMode="cover"
    accessible
    accessibilityLabel="8T Threads logo"
  />
);

const styles = StyleSheet.create({
  logo: {
    alignSelf: 'center',
  },
});
