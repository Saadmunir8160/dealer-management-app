import { useMemo } from 'react';
import { useTheme } from '@context';
import type { AppColors } from '@theme/colors';

/**
 * Build StyleSheet from current theme colors.
 * Pass a stable factory defined outside the component.
 */
export function useThemedStyles<T>(factory: (colors: AppColors, isDark: boolean) => T): T {
  const { colors, isDark } = useTheme();
  return useMemo(() => factory(colors, isDark), [colors, isDark, factory]);
}
