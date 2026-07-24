// ─────────────────────────────────────────────────────────────────────────────
// src/components/common/ErrorState.tsx
// Display when an API call or screen fails.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing } from '@theme';
import AppButton from '@components/buttons/AppButton';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  style,
}) => (
  <View style={[styles.container, style]}>
    <Text style={styles.icon}>⚠️</Text>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
    {onRetry && (
      <AppButton title="Try Again" onPress={onRetry} variant="outline" size="md" style={styles.btn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing[6] },
  icon: { fontSize: 48, marginBottom: Spacing[4] },
  title: { ...Typography.h5, color: Colors.error, textAlign: 'center', marginBottom: Spacing[2] },
  message: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing[4] },
  btn: { marginTop: Spacing[2] },
});

export default ErrorState;
