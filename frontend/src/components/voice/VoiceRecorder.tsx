import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';
import { useTheme } from '@context';

interface Props {
  isListening: boolean;
  processing: boolean;
  disabled?: boolean;
  listenSeconds: number;
  pulse: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
}

const WaveBars = memo(({ active, color }: { active: boolean; color: string }) => (
  <View style={waveStyles.waveRow}>
    {[10, 18, 28, 16, 34, 22].map((h, i) => (
      <View
        key={`w-${i}`}
        style={[
          waveStyles.waveBar,
          { height: active ? h : 8, opacity: active ? 1 : 0.35, backgroundColor: color },
        ]}
      />
    ))}
  </View>
));
WaveBars.displayName = 'WaveBars';

const waveStyles = StyleSheet.create({
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 48 },
  waveBar: { width: 3, borderRadius: 2 },
});

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: Spacing[2] },
    micRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing[2],
    },
    micBtn: { alignItems: 'center', justifyContent: 'center' },
    micBusy: { opacity: 0.7 },
    micRingOuter: {
      width: 112,
      height: 112,
      borderRadius: 56,
      borderWidth: 3,
      borderColor: c.primary + '40',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primaryLight,
    },
    micRingOuterLive: {
      borderColor: c.error + '55',
      backgroundColor: c.errorLight,
    },
    micRingInner: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    micRingInnerLive: {
      backgroundColor: c.error,
    },
    timer: {
      ...Typography.h4,
      color: c.primary,
      marginTop: Spacing[2],
      fontWeight: '700',
    },
    timerLive: { color: c.error },
  });

const VoiceRecorder: React.FC<Props> = ({
  isListening,
  processing,
  disabled,
  listenSeconds,
  pulse,
  onPressIn,
  onPressOut,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const mm = String(Math.floor(listenSeconds / 60)).padStart(2, '0');
  const ss = String(listenSeconds % 60).padStart(2, '0');

  return (
    <View style={styles.wrap}>
      <View style={styles.micRow}>
        <WaveBars active={isListening} color={colors.primary} />
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity
            style={[styles.micBtn, processing && styles.micBusy]}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled || processing}
            activeOpacity={0.85}
            delayPressIn={0}
            accessibilityLabel={isListening ? 'Release to stop' : 'Hold to speak'}
          >
            <View style={[styles.micRingOuter, isListening && styles.micRingOuterLive]}>
              <View style={[styles.micRingInner, isListening && styles.micRingInnerLive]}>
                {processing ? (
                  <ActivityIndicator color={colors.white} size="large" />
                ) : (
                  <Ionicons
                    name={isListening ? 'mic' : 'mic-outline'}
                    size={36}
                    color={colors.white}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
        <WaveBars active={isListening} color={colors.primary} />
      </View>
      <Text style={[styles.timer, isListening && styles.timerLive]}>{`${mm}:${ss}`}</Text>
    </View>
  );
};

export default memo(VoiceRecorder);
