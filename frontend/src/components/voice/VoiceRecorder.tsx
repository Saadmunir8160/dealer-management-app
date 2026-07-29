import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '@theme';

interface Props {
  isListening: boolean;
  processing: boolean;
  disabled?: boolean;
  listenSeconds: number;
  pulse: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
  hint?: string;
}

const WaveBars = memo(({ active }: { active: boolean }) => (
  <View style={styles.waveRow}>
    {[10, 18, 28, 16, 34, 22].map((h, i) => (
      <View
        key={`w-${i}`}
        style={[
          styles.waveBar,
          { height: active ? h : 8, opacity: active ? 1 : 0.35 },
        ]}
      />
    ))}
  </View>
));
WaveBars.displayName = 'WaveBars';

const VoiceRecorder: React.FC<Props> = ({
  isListening,
  processing,
  disabled,
  listenSeconds,
  pulse,
  onPressIn,
  onPressOut,
  hint,
}) => {
  const mm = String(Math.floor(listenSeconds / 60)).padStart(2, '0');
  const ss = String(listenSeconds % 60).padStart(2, '0');

  return (
    <View style={styles.wrap}>
      <View style={styles.micRow}>
        <WaveBars active={isListening} />
        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micListening, processing && styles.micBusy]}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled || processing}
            activeOpacity={0.85}
            delayPressIn={0}
            accessibilityLabel={isListening ? 'Release to stop' : 'Hold to speak'}
          >
            <View style={styles.micRingOuter}>
              <View style={[styles.micRingInner, isListening && styles.micRingInnerLive]}>
                {processing ? (
                  <ActivityIndicator color={Colors.primary} size="large" />
                ) : (
                  <Ionicons
                    name={isListening ? 'mic' : 'mic-outline'}
                    size={40}
                    color={isListening ? Colors.error : Colors.primary}
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
        <WaveBars active={isListening} />
      </View>
      <Text style={styles.timer}>{`${mm}:${ss}`}</Text>
      <Text style={styles.hint}>
        {hint ||
          (isListening
            ? 'Recording... release when finished'
            : 'Hold mic -> speak full order -> release')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: Spacing[2] },
  micRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 48 },
  waveBar: { width: 3, borderRadius: 2, backgroundColor: Colors.primary },
  micBtn: { alignItems: 'center', justifyContent: 'center' },
  micListening: { opacity: 1 },
  micBusy: { opacity: 0.7 },
  micRingOuter: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderColor: Colors.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRingInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRingInnerLive: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  timer: { ...Typography.h4, color: Colors.primary, marginTop: Spacing[2] },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
});

export default memo(VoiceRecorder);
