// Brand palette aligned with UCIC Customer Portal
export const Colors = {
  // Brand (UCIC blue)
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#EFF6FF',
  primaryBanner: '#1E40AF',
  brandNavy: '#1B3A6B',
  /** UCIC portal login CTA */
  accent: '#F39223',
  accentDark: '#D97706',

  secondary: '#16A34A',
  secondaryDark: '#15803D',
  secondaryLight: '#F0FDF4',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutrals
  black: '#0F172A',
  gray900: '#1E293B',
  gray800: '#334155',
  gray700: '#475569',
  gray600: '#64748B',
  gray500: '#94A3B8',
  gray400: '#CBD5E1',
  gray300: '#E2E8F0',
  gray200: '#F1F5F9',
  gray100: '#F8FAFC',
  white: '#FFFFFF',

  // Background
  background: '#F1F5F9',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  sidebar: '#F8FAFC',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textDisabled: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status chips
  statusActive: '#16A34A',
  statusInactive: '#94A3B8',
  statusSuspended: '#EF4444',
  statusPending: '#F59E0B',

  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
