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
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@theme';
import { SelectOption } from '@types';
import { Ionicons } from '@expo/vector-icons';

interface DropdownProps {
  label?: string;
  options: SelectOption[];
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
  /** Show clear (×) when a value is selected */
  clearable?: boolean;
  onClear?: () => void;
}

/** Slim scrollbar for RN Web FlatList / overflow containers */
const webScrollStyle =
  Platform.OS === 'web'
    ? ({
        // @ts-expect-error RN Web CSS
        scrollbarWidth: 'thin',
        scrollbarColor: `${Colors.gray400} ${Colors.gray100}`,
      } as ViewStyle)
    : undefined;

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  error,
  containerStyle,
  disabled = false,
  clearable = false,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '' && value !== 0;
  const selectedOption = hasValue
    ? options.find(o => String(o.value) === String(value))
    : undefined;

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setIsOpen(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        style={[styles.trigger, error ? styles.triggerError : null, disabled && styles.triggerDisabled]}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selectedOption && styles.placeholder]} numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        {clearable && selectedOption ? (
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation?.();
              handleClear();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
            accessibilityLabel="Clear selection"
          >
            <Ionicons name="close-circle" size={20} color={Colors.gray500} />
          </TouchableOpacity>
        ) : (
          <Text style={styles.arrow}>▾</Text>
        )}
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                showsVerticalScrollIndicator={Platform.OS !== 'web'}
                style={[styles.list, webScrollStyle]}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const selected = String(item.value) === String(value);
                  return (
                    <TouchableOpacity
                      onPress={() => handleSelect(item.value)}
                      style={[styles.option, selected && styles.optionSelected]}
                    >
                      <Text
                        style={[styles.optionText, selected && styles.optionTextSelected]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
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
  clearBtn: { marginLeft: Spacing[2], padding: 2 },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: Spacing[1] },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  dropdown: {
    width: '100%',
    maxWidth: 380,
    maxHeight: 280,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
    overflow: 'hidden',
    zIndex: 2,
  },
  list: { maxHeight: 280 },
  listContent: { paddingVertical: Spacing[1] },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    padding: Spacing[4],
    textAlign: 'center',
  },
  option: {
    paddingHorizontal: Spacing[4],
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  optionSelected: { backgroundColor: Colors.primaryLight },
  optionText: { ...Typography.body, color: Colors.textPrimary, textAlign: 'left', writingDirection: 'ltr' },
  optionTextSelected: { color: Colors.primary, fontWeight: '600' },
});

export default Dropdown;
