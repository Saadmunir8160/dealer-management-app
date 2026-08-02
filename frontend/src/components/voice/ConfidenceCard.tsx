import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FieldConfidence } from '@types';
import { Typography, Spacing, BorderRadius, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';

interface Props {
  confidence: FieldConfidence | null;
  needsConfirmation?: boolean;
}

const Badge = ({
  label,
  value,
  styles,
}: {
  label: string;
  value: number;
  styles: ReturnType<typeof createStyles>;
}) => {
  const low = value > 0 && value < 90;
  return (
    <View style={[styles.badge, low && styles.badgeLow, value === 0 && styles.badgeMute]}>
      <Text style={styles.badgeLabel}>{label}</Text>
      <Text style={[styles.badgeValue, low && styles.badgeValueLow]}>
        {value > 0 ? `${value}%` : '-'}
      </Text>
    </View>
  );
};

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.primaryLight,
      borderRadius: BorderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing[3],
      marginBottom: Spacing[3],
      gap: Spacing[2],
    },
    head: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: Spacing[2],
      flexWrap: 'wrap',
    },
    title: { ...Typography.label, color: c.primaryDark, fontWeight: '700' },
    overall: {
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing[3],
      paddingVertical: 4,
    },
    overallOk: { backgroundColor: c.successLight },
    overallWarn: { backgroundColor: c.warningLight },
    overallText: { ...Typography.caption, fontWeight: '700', color: c.textPrimary },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
    badge: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      paddingHorizontal: Spacing[2],
      paddingVertical: Spacing[1],
      minWidth: 72,
    },
    badgeLow: { borderColor: c.warning, backgroundColor: c.warningLight },
    badgeMute: { opacity: 0.55 },
    badgeLabel: { ...Typography.caption, color: c.textSecondary },
    badgeValue: { ...Typography.label, color: c.success, fontWeight: '800' },
    badgeValueLow: { color: c.warning },
    warn: { ...Typography.caption, color: c.accentDark },
    ok: { ...Typography.caption, color: c.secondaryDark },
  });

const ConfidenceCard: React.FC<Props> = ({ confidence, needsConfirmation }) => {
  const styles = useThemedStyles(createStyles);
  if (!confidence) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>AI Confidence</Text>
        <View
          style={[
            styles.overall,
            confidence.overall >= 90 ? styles.overallOk : styles.overallWarn,
          ]}
        >
          <Text style={styles.overallText}>Overall {confidence.overall}%</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Badge label="Customer" value={confidence.customer} styles={styles} />
        <Badge label="Product" value={confidence.products} styles={styles} />
        <Badge label="Quantity" value={confidence.quantity} styles={styles} />
        <Badge label="Date" value={confidence.date} styles={styles} />
        <Badge label="Area" value={confidence.area} styles={styles} />
      </View>
      {needsConfirmation || confidence.overall < 90 ? (
        <Text style={styles.warn}>
          Confidence below 90% — please confirm highlighted fields before placing the order.
        </Text>
      ) : (
        <Text style={styles.ok}>High confidence — review once, then place order.</Text>
      )}
    </View>
  );
};

export default memo(ConfidenceCard);
