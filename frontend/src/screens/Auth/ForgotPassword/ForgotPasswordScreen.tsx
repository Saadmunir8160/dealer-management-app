// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Auth/ForgotPassword/ForgotPasswordScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Users forget passwords. This screen starts the password recovery flow.
//   The user enters their email, and the backend sends a 6-digit OTP code.
//
// BUSINESS LOGIC:
//   1. User enters registered email
//   2. Form validates email format
//   3. API call to POST /api/auth/forgot-password
//   4. Backend generates OTP and emails it to the user
//   5. On success: navigate to OTP screen with email
//
// NAVIGATION FLOW:
//   ForgotPassword → (on success) → OTP Screen
//   ForgotPassword → (back) → Login
//
// FUTURE API INTEGRATION:
//   Same endpoint structure. Mock handler returns fixed OTP '123456'.
//   In production: random OTP sent via email service (SendGrid, AWS SES).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authApi } from '@api/authApi';
import { useToast } from '@context';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

const schema = yup.object({
  email: yup.string().required('Email is required').email('Enter a valid email address'),
});

type FormValues = yup.InferType<typeof schema>;

const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: data.email.trim() });
      showSuccess('OTP Sent', 'Check your email for the verification code');
      navigation.navigate('OTP', { email: data.email.trim() });
    } catch {
      showError('Error', 'Could not send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.brandSection}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>🔒</Text>
          </View>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            No worries! Enter your email and we&apos;ll send you a verification code to reset your password.
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Email Address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                placeholder="you@example.com"
                error={errors.email?.message}
              />
            )}
          />

          <AppButton
            title="Send Verification Code"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
            fullWidth
            size="lg"
          />

          <AppButton
            title="Back to Login"
            onPress={() => navigation.goBack()}
            variant="ghost"
            fullWidth
            style={styles.backBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flexGrow: 1, padding: Spacing[6], justifyContent: 'center' },
  brandSection: { alignItems: 'center', marginBottom: Spacing[8] },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  iconText: { fontSize: 32 },
  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing[2], textAlign: 'center' },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  form: { gap: Spacing[1] },
  backBtn: { marginTop: Spacing[3] },
});

export default ForgotPasswordScreen;
