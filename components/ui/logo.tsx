import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  textColor?: string;
}

const SIZES = {
  small: 60,
  medium: 100,
  large: 140,
};

const TEXT_SIZES = {
  small: 18,
  medium: 24,
  large: 32,
};

export function Logo({ size = 'medium', showText = true, textColor = '#FFFFFF' }: LogoProps) {
  const iconSize = SIZES[size];
  const textSize = TEXT_SIZES[size];

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/logo.png')}
        style={{ width: iconSize, height: iconSize * 1.2 }}
        resizeMode="contain"
      />
      {showText && (
        <Text style={[styles.text, { fontSize: textSize, color: textColor }]}>
          EcoLake
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    marginTop: 8,
  },
});
