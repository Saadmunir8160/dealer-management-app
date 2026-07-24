import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useToast } from '@context';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';

const schema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string().required('New password is required').min(6, 'Min 6 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

type FormValues = yup.InferType<typeof schema>;

const ChangePasswordScreen = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (_data: FormValues) => {
    try {
      setLoading(true);
      await new Promise(r => setTimeout(r, 600));
      showSuccess('Success', 'Password updated successfully');
      reset();
    } catch {
      showError('Error', 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Update your account password securely.</Text>

          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Current Password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.currentPassword?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="New Password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.newPassword?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <AppInput
                label="Confirm Password"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <AppButton title="Update Password" onPress={handleSubmit(onSubmit)} isLoading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing[4],
    gap: Spacing[2],
  },
  title: { ...Typography.h4, color: Colors.textPrimary },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing[3],
  },
});

export default ChangePasswordScreen;
