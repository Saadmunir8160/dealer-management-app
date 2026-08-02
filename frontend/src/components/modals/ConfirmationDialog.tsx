import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@theme';
import AppButton from '@components/buttons/AppButton';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const dialogWidth = Math.min(width - 48, 420);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View
          style={[
            styles.overlay,
            {
              paddingTop: Math.max(insets.top, Spacing[6]),
              paddingBottom: Math.max(insets.bottom, Spacing[6]),
            },
          ]}
        >
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { width: dialogWidth }]}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              <View style={styles.actions}>
                <AppButton
                  title={cancelLabel}
                  onPress={onCancel}
                  variant="outline"
                  size="md"
                  style={styles.cancelBtn}
                />
                <AppButton
                  title={confirmLabel}
                  onPress={onConfirm}
                  variant={confirmVariant}
                  size="md"
                  isLoading={isLoading}
                  style={styles.confirmBtn}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    ...Shadows.lg,
  },
  title: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing[2] },
  message: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing[5] },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  cancelBtn: { flex: 1 },
  confirmBtn: { flex: 1 },
});

export default ConfirmationDialog;
