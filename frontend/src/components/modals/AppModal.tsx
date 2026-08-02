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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import { useLayoutMetrics } from '@theme/layout';

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
}) => {
  const insets = useSafeAreaInsets();
  const { contentMaxWidth } = useLayoutMetrics();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} {...rest}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} pointerEvents="box-none">
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.content,
                {
                  paddingBottom: Math.max(insets.bottom, Spacing[6]) + Spacing[2],
                  maxWidth: contentMaxWidth ?? undefined,
                  width: '100%',
                  alignSelf: 'center',
                },
                contentStyle,
              ]}
            >
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
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
};

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
    maxHeight: '85%',
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
