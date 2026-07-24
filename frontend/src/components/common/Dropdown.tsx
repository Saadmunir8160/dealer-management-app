import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@theme';
import { SelectOption } from '@types';

interface DropdownProps {
  label?: string;
  options: SelectOption[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  containerStyle,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => String(o.value) === String(value));

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        style={[styles.trigger, error ? styles.triggerError : null, disabled && styles.triggerDisabled]}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selectedOption && styles.placeholder]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsOpen(false)} />
          <View style={styles.dropdown}>
            {options.length === 0 ? (
              <Text style={styles.emptyText}>No options available</Text>
            ) : (
              <FlatList
                data={options}
                keyExtractor={item => String(item.value)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.value)}
                    style={[
                      styles.option,
                      String(item.value) === String(value) && styles.optionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        String(item.value) === String(value) && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing[4] },
  label: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing[1] },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  triggerError: { borderColor: Colors.error },
  triggerDisabled: { opacity: 0.5, backgroundColor: Colors.gray100 },
  triggerText: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  placeholder: { color: Colors.gray500 },
  arrow: { fontSize: 16, color: Colors.gray500, marginLeft: Spacing[2] },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: Spacing[1] },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: '85%',
    maxWidth: 420,
    maxHeight: 320,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
    overflow: 'hidden',
    zIndex: 2,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    padding: Spacing[4],
    textAlign: 'center',
  },
  option: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionSelected: { backgroundColor: Colors.primaryLight },
  optionText: { ...Typography.body, color: Colors.textPrimary },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
});

export default Dropdown;
