// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Profile/EditProfileScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Allows the authenticated user to update their profile information.
//   Currently supports updating full name and phone number.
//
// BUSINESS LOGIC:
//   1. Pre-populate form with current user data from Redux
//   2. React Hook Form + Yup validates all fields
//   3. API call to PUT /api/users/me (or PATCH)
//   4. On success: update Redux state, navigate back
//   5. Email is read-only (cannot be changed from profile)
//
// NAVIGATION FLOW:
//   EditProfile ← ProfileScreen → (success) → goBack (Profile refreshes)
//
// FUTURE API INTEGRATION:
//   AuthService.updateProfile() → authApi.updateProfile() → PUT /api/users/me
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@hooks';
import { useToast } from '@context';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';
import AppCard from '@components/cards/AppCard';
import { formatInitials } from '@utils';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

// ── Yup Validation Schema ──────────────────────────────────────────────────────
const profileSchema = yup.object({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'At least 2 characters'),
  phone: yup
    .string()
    .nullable()
    .transform((v: string | null) => (v === '' ? null : v))
    .test('valid-phone', 'Enter a valid phone number', (val: string | null) => {
      if (!val) return true;
      return val.replace(/\D/g, '').length >= 10;
    }),
});

type ProfileForm = yup.InferType<typeof profileSchema>;

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
    },
  });

  // Pre-populate form when user data is available
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        phone: user.phone ?? '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileForm) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with AuthService.updateProfile()
      // await AuthService.updateProfile({
      //   fullName: data.fullName.trim(),
      //   phone: data.phone?.trim() || null,
      // });
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      showSuccess('Success', 'Profile updated successfully');
      navigation.goBack();
    } catch {
      showError('Error', 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Profile Avatar ────────────────────────────────────── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{formatInitials(user.fullName)}</Text>
            </View>
            <Text style={styles.name}>{user.fullName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          {/* ── Editable Fields ───────────────────────────────────── */}
          <AppCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Full Name"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter your full name"
                  error={errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Phone Number"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder="03001234567"
                  error={errors.phone?.message}
                />
              )}
            />

            {/* ── Read-only Fields ─────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Account Details</Text>

            <AppInput
              label="Email Address"
              value={user.email}
              editable={false}
              containerStyle={styles.readOnlyInput}
            />
            <AppInput
              label="Role"
              value={user.role}
              editable={false}
              containerStyle={styles.readOnlyInput}
            />
          </AppCard>

          {/* ── Actions ───────────────────────────────────────────── */}
          <View style={styles.actions}>
            <AppButton
              title="Save Changes"
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
            />
            <AppButton
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="ghost"
              fullWidth
              style={styles.cancelBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { padding: Spacing[4], paddingBottom: Spacing[8] },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: Spacing[5] },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  avatarText: { ...Typography.h3, color: Colors.white },
  name: { ...Typography.h5, color: Colors.textPrimary },
  email: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  // Form
  formCard: { marginBottom: Spacing[4] },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
  },
  readOnlyInput: { opacity: 0.6 },

  // Actions
  actions: {},
  cancelBtn: { marginTop: Spacing[3] },
});

export default EditProfileScreen;
