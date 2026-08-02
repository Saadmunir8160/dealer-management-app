import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Typography, Spacing, BorderRadius } from '@theme';
import { useTheme } from '@context';
import type { AppColors } from '@theme/colors';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface StatusChipProps {
  label: string;
  type?: StatusType;
  style?: ViewStyle;
}

function typeMap(colors: AppColors): Record<StatusType, { bg: string; text: string }> {
  return {
    success: { bg: colors.successLight, text: colors.success },
    warning: { bg: colors.warningLight, text: colors.warning },
    error: { bg: colors.errorLight, text: colors.error },
    info: { bg: colors.infoLight, text: colors.info },
    neutral: { bg: colors.gray200, text: colors.textSecondary },
    primary: { bg: colors.primaryLight, text: colors.primary },
  };
}

const StatusChip: React.FC<StatusChipProps> = ({ label, type = 'neutral', style }) => {
  const { colors } = useTheme();
  const map = useMemo(() => typeMap(colors), [colors]);
  const tone = map[type];

  return (
    <View style={[styles.chip, { backgroundColor: tone.bg }, style]}>
      <Text style={[styles.label, { color: tone.text }]}>{label}</Text>
    </View>
  );
};

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
