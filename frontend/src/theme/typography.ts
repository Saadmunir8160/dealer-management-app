import { Platform } from 'react-native';

/** Prefer system / Inter-like stacks for polished enterprise readability */
export const FontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  light: Platform.select({
    ios: 'System',
    android: 'sans-serif-light',
    default: 'System',
  }),
} as const;

export const FontSize = {
  xs: 11,
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
  h1: { fontSize: FontSize['4xl'], fontWeight: '700' as const, lineHeight: 40, letterSpacing: -0.5 },
  h2: { fontSize: FontSize['3xl'], fontWeight: '700' as const, lineHeight: 34, letterSpacing: -0.3 },
  h3: { fontSize: FontSize['2xl'], fontWeight: '700' as const, lineHeight: 30 },
  h4: { fontSize: FontSize.xl, fontWeight: '600' as const, lineHeight: 26 },
  h5: { fontSize: FontSize.lg, fontWeight: '600' as const, lineHeight: 24 },
  bodyLarge: { fontSize: FontSize.md, fontWeight: '400' as const, lineHeight: 24 },
  body: { fontSize: FontSize.base, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: FontSize.sm, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: FontSize.xs, fontWeight: '400' as const, lineHeight: 15 },
  label: { fontSize: FontSize.sm, fontWeight: '600' as const, lineHeight: 18 },
  button: { fontSize: FontSize.base, fontWeight: '700' as const, lineHeight: 20, letterSpacing: 0.2 },
} as const;
