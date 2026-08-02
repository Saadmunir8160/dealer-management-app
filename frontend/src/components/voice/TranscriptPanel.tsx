import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, BorderRadius, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';

interface Props {
  liveText: string;
}

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    wrap: { marginTop: Spacing[2] },
    box: {
      backgroundColor: c.gray100,
      borderRadius: BorderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing[4],
      gap: Spacing[1],
    },
    title: { ...Typography.label, color: c.primary, fontWeight: '700' },
    body: { ...Typography.body, color: c.textPrimary, lineHeight: 22 },
    placeholder: { color: c.textDisabled },
  });

const TranscriptPanel: React.FC<Props> = ({ liveText }) => {
  const styles = useThemedStyles(createStyles);
  const empty = !liveText || liveText === '—';

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <Text style={styles.title}>Live transcript</Text>
        <Text style={[styles.body, empty && styles.placeholder]}>
          {empty ? '—' : liveText}
        </Text>
      </View>
    </View>
  );
};

export default memo(TranscriptPanel);
