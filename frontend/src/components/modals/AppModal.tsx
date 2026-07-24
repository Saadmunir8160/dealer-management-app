// ─────────────────────────────────────────────────────────────────────────────
// src/components/modals/AppModal.tsx
// Reusable modal with header, close button, and customizable content.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ModalProps,
  ViewStyle,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

interface AppModalProps extends Omit<ModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  children,
  contentStyle,
  ...rest
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} {...rest}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={[styles.content, contentStyle]}>
            {title && (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {children}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing[5],
    paddingBottom: Spacing[8],
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  title: { ...Typography.h5, color: Colors.textPrimary },
  closeBtn: { fontSize: 18, color: Colors.gray500 },
});

export default AppModal;
