// ─────────────────────────────────────────────────────────────────────────────
// src/components/loaders/SkeletonLoader.tsx
// Shimmer/skeleton placeholder for loading states.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  count?: number;
}

const SkeletonItem: React.FC<SkeletonProps> = ({ width = '100%', height = 16, borderRadius = BorderRadius.md, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

const SkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <View style={styles.container}>
    {Array.from({ length: count }).map((_, i) => (
      <View key={i} style={styles.row}>
        <SkeletonItem width={48} height={48} borderRadius={24} />
        <View style={styles.textCol}>
          <SkeletonItem width="70%" height={14} />
          <SkeletonItem width="50%" height={12} style={styles.subLine} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { padding: Spacing[4] },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[4] },
  textCol: { flex: 1, marginLeft: Spacing[3] },
  subLine: { marginTop: Spacing[2] },
  skeleton: { backgroundColor: Colors.gray300 },
});

export { SkeletonItem };
export default SkeletonLoader;
