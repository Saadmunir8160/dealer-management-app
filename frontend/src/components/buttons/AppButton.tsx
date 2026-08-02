import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { Typography, Spacing, BorderRadius, Shadows } from '@theme';
import { useTheme } from '@context';
import type { AppColors } from '@theme/colors';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: Spacing[2], paddingHorizontal: Spacing[3], minHeight: 36 },
    text: { fontSize: 13 },
  },
  md: {
    container: { paddingVertical: Spacing[3], paddingHorizontal: Spacing[5], minHeight: 48 },
    text: { fontSize: 14 },
  },
  lg: {
    container: { paddingVertical: Spacing[4], paddingHorizontal: Spacing[6], minHeight: 56 },
    text: { fontSize: 16 },
  },
};

function variantFor(colors: AppColors): Record<Variant, { container: ViewStyle; text: TextStyle }> {
  return {
    primary: {
      container: { backgroundColor: colors.primary },
      text: { color: colors.white },
    },
    secondary: {
      container: { backgroundColor: colors.primaryDark },
      text: { color: colors.white },
    },
    accent: {
      container: { backgroundColor: colors.accent },
      text: { color: colors.white },
    },
    outline: {
      container: {
        backgroundColor: colors.transparent,
        borderWidth: 1.5,
        borderColor: colors.primary,
      },
      text: { color: colors.primary },
    },
    ghost: {
      container: { backgroundColor: colors.transparent },
      text: { color: colors.primary },
    },
    danger: {
      container: { backgroundColor: colors.error },
      text: { color: colors.white },
    },
  };
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const { colors } = useTheme();
  const variants = useMemo(() => variantFor(colors), [colors]);
  const isDisabled = disabled || isLoading;
  const isFilled = variant === 'primary' || variant === 'secondary' || variant === 'accent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      style={[
        styles.base,
        variants[variant].container,
        sizeStyles[size].container,
        isFilled && (Shadows.md as ViewStyle),
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={variants[variant].text.color} size="small" />
      ) : (
        <Text style={[styles.text, variants[variant].text, sizeStyles[size].text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  text: { ...Typography.button },
});

export default AppButton;
