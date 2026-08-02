import React, { ReactNode, useMemo } from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Spacing, BorderRadius, Shadows } from '@theme';
import { useTheme } from '@context';

interface AppCardProps {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: 'sm' | 'md' | 'lg';
}

const AppCard: React.FC<AppCardProps> = ({ children, onPress, style, shadow = 'md' }) => {
  const { colors, isDark } = useTheme();
  const Container = onPress ? TouchableOpacity : View;

  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        ...(isDark ? { shadowOpacity: 0, elevation: 0 } : null),
      },
      !isDark ? (Shadows[shadow] as ViewStyle) : null,
      style,
    ],
    [colors.surface, colors.border, isDark, shadow, style],
  );

  return (
    <Container onPress={onPress} activeOpacity={0.88} style={cardStyle}>
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    borderWidth: StyleSheet.hairlineWidth,
  },
});

export default AppCard;
