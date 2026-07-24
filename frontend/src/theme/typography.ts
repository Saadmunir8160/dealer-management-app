// ─────────────────────────────────────────────────────────────────────────────
// src/theme/typography.ts
// Typography scale for consistent text styling across the app.
// ─────────────────────────────────────────────────────────────────────────────
import { Platform } from 'react-native';

export const FontFamily = {
  regular: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular' }),
  medium: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium' }),
  semiBold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold' }),
  bold: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold' }),
  light: Platform.select({ ios: 'Inter-Light', android: 'Inter-Light' }),
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Typography = {
  h1: { fontSize: FontSize['4xl'], fontFamily: FontFamily.bold, lineHeight: 40 },
  h2: { fontSize: FontSize['3xl'], fontFamily: FontFamily.bold, lineHeight: 34 },
  h3: { fontSize: FontSize['2xl'], fontFamily: FontFamily.semiBold, lineHeight: 30 },
  h4: { fontSize: FontSize.xl, fontFamily: FontFamily.semiBold, lineHeight: 26 },
  h5: { fontSize: FontSize.lg, fontFamily: FontFamily.semiBold, lineHeight: 24 },
  bodyLarge: { fontSize: FontSize.md, fontFamily: FontFamily.regular, lineHeight: 24 },
  body: { fontSize: FontSize.base, fontFamily: FontFamily.regular, lineHeight: 22 },
  bodySmall: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, lineHeight: 18 },
  caption: { fontSize: FontSize.xs, fontFamily: FontFamily.regular, lineHeight: 14 },
  label: { fontSize: FontSize.sm, fontFamily: FontFamily.medium, lineHeight: 18 },
  button: { fontSize: FontSize.base, fontFamily: FontFamily.semiBold, lineHeight: 20 },
} as const;
