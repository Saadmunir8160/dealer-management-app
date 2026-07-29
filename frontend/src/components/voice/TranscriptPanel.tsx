import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';

interface Props {
  liveText: string;
  typedCommand: string;
  onChangeTyped: (text: string) => void;
  onExtract: () => void;
  extracting: boolean;
  extractLabel?: string;
}

const TranscriptPanel: React.FC<Props> = ({
  liveText,
  typedCommand,
  onChangeTyped,
  onExtract,
  extracting,
  extractLabel = 'Extract',
}) => (
  <View style={styles.wrap}>
    <View style={styles.box}>
      <Text style={styles.title}>Live transcript</Text>
      <Text style={styles.body}>{liveText || '—'}</Text>
    </View>

    <Text style={styles.typeLabel}>Or paste / type transcript</Text>
    <View style={styles.typeRow}>
      <View style={{ flex: 1 }}>
        <AppInput
          value={typedCommand}
          onChangeText={onChangeTyped}
          placeholder=""
          filled
          onSubmitEditing={onExtract}
        />
      </View>
      <AppButton
        title={extracting ? '…' : extractLabel}
        onPress={onExtract}
        disabled={extracting || !typedCommand.trim()}
        style={styles.runBtn}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { gap: Spacing[2], marginBottom: Spacing[3] },
  box: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[3],
    gap: Spacing[1],
  },
  title: { ...Typography.label, color: Colors.primaryDark },
  body: { ...Typography.body, color: Colors.textPrimary, lineHeight: 22 },
  typeLabel: { ...Typography.caption, color: Colors.textSecondary },
  typeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  runBtn: { minWidth: 96, marginTop: 2 },
});

export default memo(TranscriptPanel);
