// ─────────────────────────────────────────────────────────────────────────────
// src/components/cards/AppCard.tsx
// Generic surface card with optional press handler and shadow.
// ─────────────────────────────────────────────────────────────────────────────
import React, { ReactNode } from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@theme';

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg';
}

const AppCard: React.FC<AppCardProps> = ({ children, onPress, style, shadow = 'sm' }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, Shadows[shadow] as ViewStyle, style]}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default AppCard;
