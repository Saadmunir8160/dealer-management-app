// ─────────────────────────────────────────────────────────────────────────────
// src/components/common/Avatar.tsx
// Circular avatar with initials or image.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius } from '@theme';
import { formatInitials } from '@utils';

interface AvatarProps {
  name?: string;
  uri?: string;
  size?: number;
  style?: ViewStyle;
}

const Avatar: React.FC<AvatarProps> = ({ name, uri, size = 48, style }) => {
  const initials = name ? formatInitials(name) : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }, style]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  fallback: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { fontFamily: 'Inter-SemiBold', color: Colors.primary },
});

export default Avatar;
