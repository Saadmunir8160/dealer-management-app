import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FieldConfidence } from '@types';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

interface Props {
  confidence: FieldConfidence | null;
  needsConfirmation?: boolean;
}

const Badge = ({ label, value }: { label: string; value: number }) => {
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

const ConfidenceCard: React.FC<Props> = ({ confidence, needsConfirmation }) => {
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
        <Badge label="Customer" value={confidence.customer} />
        <Badge label="Product" value={confidence.products} />
        <Badge label="Quantity" value={confidence.quantity} />
        <Badge label="Date" value={confidence.date} />
        <Badge label="Area" value={confidence.area} />
      </View>
      {needsConfirmation || confidence.overall < 90 ? (
        <Text style={styles.warn}>
          Confidence below 90% - please confirm highlighted fields before placing the order.
        </Text>
      ) : (
        <Text style={styles.ok}>High confidence - review once, then place order.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  title: { ...Typography.label, color: Colors.primaryDark, fontWeight: '700' },
  overall: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
  },
  overallOk: { backgroundColor: Colors.successLight },
  overallWarn: { backgroundColor: Colors.warningLight },
  overallText: { ...Typography.caption, fontWeight: '700', color: Colors.textPrimary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  badge: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    minWidth: 72,
  },
  badgeLow: { borderColor: Colors.warning, backgroundColor: Colors.warningLight },
  badgeMute: { opacity: 0.55 },
  badgeLabel: { ...Typography.caption, color: Colors.textSecondary },
  badgeValue: { ...Typography.label, color: Colors.success, fontWeight: '800' },
  badgeValueLow: { color: Colors.warning },
  warn: { ...Typography.caption, color: '#9A3412' },
  ok: { ...Typography.caption, color: Colors.secondaryDark },
});

export default memo(ConfidenceCard);
