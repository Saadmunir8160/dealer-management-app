// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Dealers/EditDealer/EditDealerScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Allows users to update an existing dealer's information.
//   Pre-populates the form with current data for easy editing.
//
// BUSINESS LOGIC:
//   1. Load existing dealer data by ID
//   2. Pre-fill form with current values
//   3. User modifies fields
//   4. React Hook Form + Yup validates
//   5. API call to PUT /api/dealers/:id
//   6. On success: navigate back (detail screen refreshes)
//
// FUTURE API INTEGRATION:
//   DealerService.updateDealer() → dealerApi.update() → PUT /api/dealers/:id
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
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
import { AppStackParamList, Dealer, UpdateDealerRequest } from '@types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { DealerService } from '@services/dealerService';
import { useToast } from '@context';
import { Colors, Typography, Spacing } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';
import AppCard from '@components/cards/AppCard';
import AppLoader from '@components/loaders/AppLoader';

type Props = NativeStackScreenProps<AppStackParamList, 'EditDealer'>;

const schema = yup.object({
  dealerName: yup.string().required('Dealer name is required').min(2, 'At least 2 characters'),
  contactPerson: yup.string().required('Contact person is required'),
  phone: yup.string().required('Phone is required').min(10, 'Enter a valid phone number'),
  email: yup.string().required('Email is required').email('Enter a valid email'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
});

type DealerForm = yup.InferType<typeof schema>;

const EditDealerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { dealerId } = route.params;
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DealerForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      dealerName: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
    },
  });

  useEffect(() => {
    DealerService.fetchDealerById(String(dealerId))
      .then((dealer: Dealer) => {
        reset({
          dealerName: dealer.dealerName,
          contactPerson: dealer.contactPerson ?? '',
          phone: dealer.phone ?? '',
          email: dealer.email ?? '',
          address: dealer.address ?? '',
          city: dealer.city ?? '',
        });
      })
      .catch(() => showError('Error', 'Failed to load dealer'))
      .finally(() => setIsLoading(false));
  }, [dealerId]);

  const onSubmit = async (data: DealerForm) => {
    setIsSubmitting(true);
    try {
      const payload: UpdateDealerRequest = {
        dealerName: data.dealerName.trim(),
        contactPerson: data.contactPerson.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
      };
      await DealerService.updateDealer({ id: dealerId, ...payload });
      showSuccess('Success', 'Dealer updated successfully');
      navigation.goBack();
    } catch {
      showError('Error', 'Failed to update dealer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <AppLoader message="Loading dealer..." />;

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
          <Text style={styles.title}>Edit Dealer</Text>
          <Text style={styles.subtitle}>Update the dealer information below</Text>

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
                  error={errors.city?.message}
                />
              )}
            />
          </AppCard>

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

export default EditDealerScreen;
