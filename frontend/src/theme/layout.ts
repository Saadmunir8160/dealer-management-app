// Responsive layout tokens and helpers — keep visual design; adapt to device chrome.
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Visible tab content (icon + label), excluding system inset */
export const TAB_BAR_CONTENT_HEIGHT = 56;
export const TAB_BAR_TOP_PADDING = 6;
/** Minimum padding under tabs when inset is 0 (rare / web) */
export const TAB_BAR_MIN_BOTTOM_PAD = 8;

export const BREAKPOINTS = {
  phoneSm: 360,
  phone: 400,
  phablet: 600,
  tablet: 768,
  desktop: 1024,
} as const;

export function tabBarMetrics(bottomInset: number) {
  const paddingBottom = Math.max(bottomInset, TAB_BAR_MIN_BOTTOM_PAD);
  return {
    paddingBottom,
    paddingTop: TAB_BAR_TOP_PADDING,
    height: TAB_BAR_CONTENT_HEIGHT + paddingBottom,
  };
}

export function useLayoutMetrics() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isSmallPhone = width < BREAKPOINTS.phoneSm;
  const isTablet = width >= BREAKPOINTS.tablet;
  const tab = tabBarMetrics(insets.bottom);

  /** Centered column on tablets / wide screens without changing phone layout */
  const contentMaxWidth = isTablet ? Math.min(720, width - 48) : undefined;

  const screenPaddingH = isSmallPhone ? 12 : 16;
  const scrollBottomPad = Math.max(insets.bottom, 16) + (Platform.OS === 'web' ? 24 : 16);

  return {
    insets,
    width,
    height,
    isLandscape,
    isSmallPhone,
    isTablet,
    tabBar: tab,
    contentMaxWidth,
    screenPaddingH,
    scrollBottomPad,
  };
}
