// ─────────────────────────────────────────────────────────────────────────────
// src/components/common/StatusChip.tsx
// Colored status chip for order statuses, dealer statuses, etc.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface StatusChipProps {
  label: string;
  type?: StatusType;
  style?: ViewStyle;
}

const typeMap: Record<StatusType, { bg: string; text: string }> = {
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  error: { bg: Colors.errorLight, text: Colors.error },
  info: { bg: Colors.infoLight, text: Colors.info },
  neutral: { bg: Colors.gray200, text: Colors.gray700 },
  primary: { bg: Colors.primaryLight, text: Colors.primary },
};

const StatusChip: React.FC<StatusChipProps> = ({ label, type = 'neutral', style }) => (
  <View style={[styles.chip, { backgroundColor: typeMap[type].bg }, style]}>
    <Text style={[styles.label, { color: typeMap[type].text }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  label: { ...Typography.caption, fontWeight: '600' },
});

export default StatusChip;
