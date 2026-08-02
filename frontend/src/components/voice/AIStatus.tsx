import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { VoiceAiPhase } from '@types';
import { Typography, Spacing, BorderRadius, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';
import { useTheme } from '@context';

interface Props {
  phase: VoiceAiPhase;
  progress?: number;
  message?: string;
}

const LABEL: Record<VoiceAiPhase, string> = {
  idle: 'Ready',
  recording: 'Listening…',
  processing: 'Extracting…',
  review: 'Review needed',
  success: 'Ready',
  error: 'Error',
};

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    wrap: {
      gap: 8,
      marginBottom: Spacing[3],
      padding: Spacing[3],
      borderRadius: BorderRadius.xl,
      backgroundColor: c.gray100,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: c.gray400,
    },
    label: { ...Typography.label, color: c.textPrimary, fontWeight: '700', flex: 1 },
    barTrack: {
      height: 6,
      borderRadius: BorderRadius.full,
      backgroundColor: c.gray200,
      overflow: 'hidden',
    },
    barFill: {
      height: 6,
      borderRadius: BorderRadius.full,
      backgroundColor: c.primary,
    },
    msg: { ...Typography.caption, color: c.textSecondary },
  });

const AIStatus: React.FC<Props> = ({ phase, progress = 0, message }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phase !== 'processing' && phase !== 'recording') {
      shimmer.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [phase, shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const isBusy = phase === 'processing' || phase === 'recording';

  const dotColor =
    phase === 'recording'
      ? colors.error
      : phase === 'processing'
        ? colors.primary
        : phase === 'success'
          ? colors.success
          : phase === 'error'
            ? colors.error
            : colors.gray400;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Animated.View
          style={[styles.dot, { backgroundColor: dotColor }, isBusy && { opacity }]}
        />
        <Text style={styles.label}>{LABEL[phase]}</Text>
        {phase === 'processing' ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
      </View>
      {phase === 'processing' ? (
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${Math.max(8, Math.min(100, progress))}%` }]}
          />
        </View>
      ) : null}
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
};

export default memo(AIStatus);
