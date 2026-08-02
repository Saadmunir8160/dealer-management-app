import React, { memo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { VoiceAiPhase } from '@types';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

interface Props {
  phase: VoiceAiPhase;
  progress?: number;
  message?: string;
}

const LABEL: Record<VoiceAiPhase, string> = {
  idle: 'Ready',
  recording: 'Listening...',
  processing: 'Extracting...',
  review: 'Review needed',
  success: 'Ready',
  error: 'Error',
};

const AIStatus: React.FC<Props> = ({ phase, progress = 0, message }) => {
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

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.dot,
            phase === 'recording' && styles.dotLive,
            phase === 'processing' && styles.dotAi,
            phase === 'success' && styles.dotOk,
            phase === 'error' && styles.dotErr,
            isBusy && { opacity },
          ]}
        />
        <Text style={styles.label}>{LABEL[phase]}</Text>
        {phase === 'processing' ? (
          <ActivityIndicator size="small" color={Colors.primary} />
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

const styles = StyleSheet.create({
  wrap: { gap: 6, marginBottom: Spacing[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gray400,
  },
  dotLive: { backgroundColor: Colors.error },
  dotAi: { backgroundColor: Colors.primary },
  dotOk: { backgroundColor: Colors.success },
  dotErr: { backgroundColor: Colors.error },
  label: { ...Typography.label, color: Colors.textPrimary, fontWeight: '700' },
  barTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  msg: { ...Typography.caption, color: Colors.textSecondary },
});

export default memo(AIStatus);
