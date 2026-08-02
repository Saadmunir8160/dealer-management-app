/** UCIC enterprise palette — light (default) */
export const LightColors = {
  primary: '#2563EB',
  primaryDark: '#1E40AF',
  primaryLight: '#EFF6FF',
  primaryBanner: '#1E40AF',
  brandNavy: '#1E40AF',
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#FFFBEB',

  secondary: '#1E40AF',
  secondaryDark: '#1E3A8A',
  secondaryLight: '#DBEAFE',

  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoLight: '#DBEAFE',

  black: '#0F172A',
  gray900: '#0F172A',
  gray800: '#1E293B',
  gray700: '#334155',
  gray600: '#64748B',
  gray500: '#94A3B8',
  gray400: '#CBD5E1',
  gray300: '#E2E8F0',
  gray200: '#F1F5F9',
  gray100: '#F8FAFC',
  /** Always true white — on-primary / inverse text */
  white: '#FFFFFF',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  sidebar: '#F8FAFC',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textDisabled: '#94A3B8',
  textInverse: '#FFFFFF',

  statusActive: '#10B981',
  statusInactive: '#94A3B8',
  statusSuspended: '#EF4444',
  statusPending: '#F59E0B',

  tabBar: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
  transparent: 'transparent',
} as const;

/** Dark mode — enterprise slate surfaces */
export const DarkColors = {
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#1E3A5F',
  primaryBanner: '#1E40AF',
  brandNavy: '#93C5FD',
  accent: '#F59E0B',
  accentDark: '#D97706',
  accentLight: '#451A03',

  secondary: '#60A5FA',
  secondaryDark: '#3B82F6',
  secondaryLight: '#1E3A5F',

  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  error: '#F87171',
  errorLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A5F',

  black: '#020617',
  gray900: '#F8FAFC',
  gray800: '#E2E8F0',
  gray700: '#CBD5E1',
  gray600: '#94A3B8',
  gray500: '#64748B',
  gray400: '#475569',
  gray300: '#334155',
  gray200: '#1F2937',
  gray100: '#1E293B',
  white: '#FFFFFF',

  background: '#0B1220',
  surface: '#111827',
  surfaceElevated: '#1E293B',
  border: '#243044',
  sidebar: '#0B1220',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textDisabled: '#64748B',
  textInverse: '#0F172A',

  statusActive: '#34D399',
  statusInactive: '#64748B',
  statusSuspended: '#F87171',
  statusPending: '#FBBF24',

  tabBar: '#111827',
  overlay: 'rgba(0, 0, 0, 0.72)',
  transparent: 'transparent',
} as const;

export type AppColors = { -readonly [K in keyof typeof LightColors]: string };

/** Default / fallback — prefer `useTheme().colors` for live light/dark */
export const Colors: AppColors = { ...LightColors };

export type ColorKey = keyof AppColors;
