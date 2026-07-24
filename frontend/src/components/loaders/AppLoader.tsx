// ─────────────────────────────────────────────────────────────────────────────
// src/components/loaders/AppLoader.tsx
// Centered activity indicator with optional message.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@theme';

interface AppLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const AppLoader: React.FC<AppLoaderProps> = ({ message, fullScreen = true }) => (
  <View style={fullScreen ? styles.fullScreen : styles.inline}>
    <ActivityIndicator size="large" color={Colors.primary} />
    {message && <Text style={styles.message}>{message}</Text>}
  </View>
);

const styles = StyleSheet.create({
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  inline: { padding: Spacing[6], justifyContent: 'center', alignItems: 'center' },
  message: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing[3] },
});

export default AppLoader;
