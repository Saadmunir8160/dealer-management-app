// ─────────────────────────────────────────────────────────────────────────────
// src/components/inputs/AppInput.tsx
// Controlled text input with label, error message, and optional icons.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  /** Soft grey fill like UCIC portal inputs */
  filled?: boolean;
}

const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  isPassword = false,
  filled = false,
  ...rest
}) => {
  const [isSecure, setIsSecure] = useState(isPassword);
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          filled && styles.inputFilled,
          hasError && styles.inputError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.gray500}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setIsSecure(prev => !prev)} style={styles.eyeIcon}>
            <Text style={styles.eyeText}>{isSecure ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing[4] },
  label: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing[1] },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[3],
  },
  inputFilled: {
    backgroundColor: '#E8EEF4',
    borderColor: '#D5DCE6',
    borderRadius: BorderRadius.lg,
  },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: Spacing[3],
  },
  eyeIcon: { padding: Spacing[2] },
  eyeText: { fontSize: 16 },
  errorText: { ...Typography.caption, color: Colors.error, marginTop: Spacing[1] },
});

export default AppInput;
