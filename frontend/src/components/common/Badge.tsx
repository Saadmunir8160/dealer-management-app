// ─────────────────────────────────────────────────────────────────────────────
// src/components/common/Badge.tsx
// Small numeric badge for counts (notifications, cart items).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, BorderRadius, Spacing } from '@theme';

interface BadgeProps {
  count: number;
  max?: number;
  color?: string;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({ count, max = 99, color = Colors.error, style }) => {
  if (count <= 0) return null;
  const display = count > max ? `${max}+` : String(count);

  return (
    <View style={[styles.badge, { backgroundColor: color }, style]}>
      <Text style={styles.text}>{display}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[1],
  },
  text: { ...Typography.caption, color: Colors.white, fontSize: 10 },
});

export default Badge;
