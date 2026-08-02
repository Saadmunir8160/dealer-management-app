import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Typography, Spacing } from '@theme';
import { useTheme } from '@context';

interface AppLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const AppLoader: React.FC<AppLoaderProps> = ({ message, fullScreen = true }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        fullScreen ? styles.fullScreen : styles.inline,
        fullScreen && { backgroundColor: colors.background },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? (
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inline: { padding: Spacing[6], justifyContent: 'center', alignItems: 'center' },
  message: { ...Typography.body, marginTop: Spacing[3] },
});

export default AppLoader;
