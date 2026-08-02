// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Dealers/AddDealer/AddDealerScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Allows authenticated users to register a new dealer in the system.
//   The form collects all required dealer information with validation.
//
// BUSINESS LOGIC:
//   1. User fills in dealer name, contact, phone, email, address, city
//   2. React Hook Form + Yup validates all fields
//   3. API call to POST /api/dealers
//   4. On success: navigate back to dealer list (auto-refreshes)
//
// NAVIGATION FLOW:
//   AddDealer → (on success) → DealersScreen (goBack triggers refresh)
//   AddDealer → (cancel) → goBack
//
// FUTURE API INTEGRATION:
//   DealerService.createDealer() → dealerApi.create() → POST /api/dealers
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
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
import { AppStackParamList, CreateDealerRequest } from '@types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { DealerService } from '@services/dealerService';
import { useToast } from '@context';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';
import AppCard from '@components/cards/AppCard';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateDealer'>;

// ── Yup Validation Schema ──────────────────────────────────────────────────────
const dealerSchema = yup.object({
  dealerName: yup.string().required('Dealer name is required').min(2, 'At least 2 characters'),
  contactPerson: yup.string().required('Contact person is required'),
  phone: yup.string().required('Phone is required').min(10, 'Enter a valid phone number'),
  email: yup.string().required('Email is required').email('Enter a valid email'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
});

type DealerForm = yup.InferType<typeof dealerSchema>;

const AddDealerScreen: React.FC<Props> = ({ navigation }) => {
  const { showSuccess, showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DealerForm>({
    resolver: yupResolver(dealerSchema),
    defaultValues: {
      dealerName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
    },
  });

  const onSubmit = async (data: DealerForm) => {
    setIsSubmitting(true);
    try {
      const payload: CreateDealerRequest = {
        dealerName: data.dealerName.trim(),
        contactPerson: data.contactPerson.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
      };
      await DealerService.createDealer(payload);
      showSuccess('Success', 'Dealer created successfully');
      navigation.goBack();
    } catch {
      showError('Error', 'Failed to create dealer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Add New Dealer</Text>
          <Text style={styles.subtitle}>Fill in the dealer information below</Text>

          <AppCard style={styles.formCard}>
            <Text style={styles.sectionTitle}>Business Details</Text>

            <Controller
              control={control}
              name="dealerName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Dealer Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. ABC Traders"
                  error={errors.dealerName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="contactPerson"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Contact Person"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Ahmed Ali"
                  error={errors.contactPerson?.message}
                />
              )}
            />

            <Text style={styles.sectionTitle}>Contact</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  placeholder="dealer@example.com"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Phone"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  placeholder="03001234567"
                  error={errors.phone?.message}
                />
              )}
            />

            <Text style={styles.sectionTitle}>Location</Text>

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Street address"
                  error={errors.address?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  label="City"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="e.g. Lahore"
                  error={errors.city?.message}
                />
              )}
            />
          </AppCard>

          <View style={styles.actions}>
            <AppButton
              title="Create Dealer"
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
  title: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing[4] },
  formCard: { marginBottom: Spacing[4] },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    marginTop: Spacing[2],
  },
  actions: {},
  cancelBtn: { marginTop: Spacing[3] },
});

export default AddDealerScreen;
