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
import { Typography, Spacing, BorderRadius } from '@theme';
import { useTheme } from '@context';

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
  const { colors, isDark } = useTheme();
  const [isSecure, setIsSecure] = useState(isPassword);
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: hasError ? colors.error : colors.border,
            backgroundColor: filled
              ? isDark
                ? colors.gray100
                : '#E8EEF4'
              : colors.surface,
          },
          filled && !isDark && styles.inputFilledLight,
          filled && { borderRadius: BorderRadius.lg },
        ]}
      >
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholderTextColor={colors.gray500}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setIsSecure(prev => !prev)} style={styles.eyeIcon}>
            <Text style={styles.eyeText}>{isSecure ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {hasError ? (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: Spacing[4] },
  label: { ...Typography.label, marginBottom: Spacing[1] },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
  },
  inputFilledLight: {
    borderColor: '#D5DCE6',
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: Spacing[3],
  },
  eyeIcon: { padding: Spacing[2] },
  eyeText: { fontSize: 16 },
  errorText: { ...Typography.caption, marginTop: Spacing[1] },
});

export default AppInput;
