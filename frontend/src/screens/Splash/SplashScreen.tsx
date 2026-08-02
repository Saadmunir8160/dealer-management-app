import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

const LOGO = require('../../../assets/ucic-logo.png');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 48, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim, scaleAnim, pulse]);

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.logoCard}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.brandEn}>UNITED CEMENT</Text>
        <Text style={styles.brandSub}>INDUSTRIAL COMPANY</Text>
        <Text style={styles.brandAr}>شركة الأسمنت المتحدة الصناعية</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Customer Portal</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.loader, { opacity: pulse }]}>
        <View style={styles.barTrack}>
          <View style={styles.barFill} />
        </View>
        <Text style={styles.loadingText}>Loading your workspace…</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  blobTop: { top: -80, right: -60 },
  blobBottom: { bottom: -100, left: -80, backgroundColor: 'rgba(245, 158, 11, 0.18)' },
  content: { alignItems: 'center', paddingHorizontal: Spacing[6] },
  logoCard: {
    width: 112,
    height: 112,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[5],
    padding: Spacing[3],
  },
  logo: { width: 88, height: 88 },
  brandEn: {
    ...Typography.h4,
    color: Colors.white,
    letterSpacing: 1.2,
    fontWeight: '800',
  },
  brandSub: {
    ...Typography.label,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
    marginTop: 4,
  },
  brandAr: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing[3],
    textAlign: 'center',
  },
  pill: {
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.accent,
  },
  pillText: { ...Typography.label, color: Colors.white, fontWeight: '700' },
  loader: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
    width: '70%',
  },
  barTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  barFill: {
    width: '55%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.white,
  },
  loadingText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: Spacing[3],
  },
});

export default SplashScreen;
