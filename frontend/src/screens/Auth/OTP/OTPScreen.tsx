import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@types';
import { authApi } from '@api/authApi';
import { useToast } from '@context';
import { isValidOTP } from '@utils';
import { Colors, Typography, Spacing } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params;
  const { showError, showSuccess } = useToast();
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!isValidOTP(otp)) e.otp = 'Enter a valid 6-digit OTP';
    if (newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      showSuccess('Password Reset', 'You can now sign in with your new password');
      navigation.navigate('Login');
    } catch {
      showError('Error', 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the code sent to {email}</Text>

        <AppInput
          label="OTP Code"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          error={errors.otp}
        />
        <AppInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          isPassword
          placeholder="••••••••"
          error={errors.newPassword}
        />
        <AppInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          placeholder="••••••••"
          error={errors.confirmPassword}
        />

        <AppButton title="Reset Password" onPress={handleReset} isLoading={isLoading} fullWidth size="lg" />
        <AppButton title="Back" onPress={() => navigation.goBack()} variant="ghost" fullWidth style={styles.backBtn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: Spacing[6], justifyContent: 'center' },
  title: { ...Typography.h2, color: Colors.textPrimary, marginBottom: Spacing[2] },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing[6] },
  backBtn: { marginTop: Spacing[3] },
});

export default OTPScreen;
