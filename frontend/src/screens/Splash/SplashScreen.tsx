// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Splash/SplashScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   The splash screen is the first thing the user sees when opening the app.
//   While this screen is visible, the app is:
//     1. Hydrating Redux state from AsyncStorage (restoring login session)
//     2. Checking if user is authenticated
//     3. Deciding whether to show Auth or App navigator
//   It gives the app a professional feel (like SAP, Salesforce, Zoho).
//
// BUSINESS LOGIC:
//   None — pure branding screen. Navigation is handled by RootNavigator.
//
// NAVIGATION FLOW:
//   Splash → (if authenticated) → Dashboard
//   Splash → (if not authenticated) → Login
//
// FUTURE API INTEGRATION:
//   No API calls needed. This screen is purely visual.
//
// BEST PRACTICES:
//   - No business logic here
//   - No API calls here
//   - Keep it lightweight — it should render instantly
//   - Uses only theme tokens (no hardcoded colors/sizes)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>DMS</Text>
        </View>
        <Text style={styles.title}>Dealer Management</Text>
        <Text style={styles.subtitle}>Enterprise System</Text>
      </Animated.View>

      <Animated.View style={[styles.loaderContainer, { opacity: dotAnim }]}>
        <View style={styles.loaderRow}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotMid]} />
          <View style={styles.dot} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { alignItems: 'center' },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  logoText: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: Colors.primary,
  },
  title: {
    ...Typography.h3,
    color: Colors.white,
    marginBottom: Spacing[1],
  },
  subtitle: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 80,
  },
  loaderRow: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotMid: {
    backgroundColor: Colors.white,
  },
});

export default SplashScreen;
