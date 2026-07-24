// ─────────────────────────────────────────────────────────────────────────────
// src/components/common/EmptyState.tsx
// Display when a list or screen has no data.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '@theme';
import AppButton from '@components/buttons/AppButton';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📭',
  title,
  message,
  actionLabel,
  onAction,
  style,
}) => (
  <View style={[styles.container, style]}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    {message && <Text style={styles.message}>{message}</Text>}
    {actionLabel && onAction && (
      <AppButton title={actionLabel} onPress={onAction} variant="outline" size="md" style={styles.btn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
  icon: { fontSize: 48, marginBottom: Spacing[4] },
  title: { ...Typography.h5, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing[2] },
  message: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing[4] },
  btn: { marginTop: Spacing[2] },
});

export default EmptyState;
