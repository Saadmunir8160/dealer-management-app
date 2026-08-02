// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Dealers/DealerDetailScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Shows the full profile of a single dealer with all their details.
//   Allows viewing contact info, address, status, and performing actions
//   like toggling status, editing, or creating an order for this dealer.
//
// BUSINESS LOGIC:
//   1. Fetch dealer by ID from API
//   2. Display all dealer information in organized sections
//   3. Toggle active/inactive status with confirmation
//   4. Navigate to EditDealer or CreateOrder
//
// FUTURE API INTEGRATION:
//   DealerService.fetchDealerById() → dealerApi.getById() → GET /api/dealers/:id
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, Dealer } from '@types';
import { DealerService } from '@services/dealerService';
import { useToast } from '@context';
import { formatDate } from '@utils';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppCard from '@components/cards/AppCard';
import AppButton from '@components/buttons/AppButton';
import { Avatar, StatusChip } from '@components/common';
import AppLoader from '@components/loaders/AppLoader';
import ConfirmationDialog from '@components/modals/ConfirmationDialog';

type Props = NativeStackScreenProps<AppStackParamList, 'DealerDetail'>;

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '—'}</Text>
  </View>
);

const DealerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { dealerId } = route.params;
  const { showSuccess, showError } = useToast();
  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showToggleDialog, setShowToggleDialog] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const loadDealer = useCallback(async () => {
    setIsLoading(true);
    try {
      const d = await DealerService.fetchDealerById(String(dealerId));
      setDealer(d);
    } catch {
      showError('Error', 'Failed to load dealer details');
    } finally {
      setIsLoading(false);
    }
  }, [dealerId]);

  useEffect(() => { loadDealer(); }, [loadDealer]);

  const handleToggleStatus = async () => {
    if (!dealer) return;
    setIsToggling(true);
    try {
      const newStatus = !dealer.status;
      await DealerService.toggleDealerStatus(String(dealer.dealerId), dealer.status as any);
      setDealer({ ...dealer, status: newStatus });
      showSuccess('Updated', `Dealer ${newStatus ? 'activated' : 'deactivated'}`);
    } catch {
      showError('Error', 'Failed to update dealer status');
    } finally {
      setIsToggling(false);
      setShowToggleDialog(false);
    }
  };

  if (isLoading) return <AppLoader message="Loading dealer..." />;
  if (!dealer) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dealer not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── Header Card ────────────────────────────────────────────── */}
        <AppCard style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Avatar name={dealer.dealerName} size={56} />
            <View style={styles.headerInfo}>
              <Text style={styles.dealerName}>{dealer.dealerName}</Text>
              <Text style={styles.dealerCity}>{dealer.city ?? 'No city'}</Text>
            </View>
            <StatusChip
              label={dealer.status ? 'Active' : 'Inactive'}
              type={dealer.status ? 'success' : 'neutral'}
            />
          </View>
        </AppCard>

        {/* ── Contact Info ───────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <InfoRow label="Contact Person" value={dealer.contactPerson ?? '—'} />
          <InfoRow label="Email" value={dealer.email ?? '—'} />
          <InfoRow label="Phone" value={dealer.phone ?? '—'} />
        </AppCard>

        {/* ── Address ────────────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <InfoRow label="Street" value={dealer.address ?? '—'} />
          <InfoRow label="City" value={dealer.city ?? '—'} />
        </AppCard>

        {/* ── Account Info ───────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Account Info</Text>
          <InfoRow label="Dealer ID" value={`#${dealer.dealerId}`} />
          <InfoRow label="Created" value={formatDate(dealer.createdDate)} />
          <InfoRow label="Status" value={dealer.status ? 'Active' : 'Inactive'} />
        </AppCard>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <View style={styles.actions}>
          <AppButton
            title="Create Order"
            onPress={() => navigation.navigate('CreateOrder', { dealerId: dealer.dealerId })}
            variant="primary"
            fullWidth
            size="lg"
          />
          <AppButton
            title={dealer.status ? 'Deactivate Dealer' : 'Activate Dealer'}
            onPress={() => setShowToggleDialog(true)}
            variant={dealer.status ? 'danger' : 'outline'}
            fullWidth
            style={styles.toggleBtn}
          />
          <AppButton
            title="Edit Dealer"
            onPress={() => navigation.navigate('EditDealer', { dealerId: dealer.dealerId })}
            variant="outline"
            fullWidth
            style={styles.editBtn}
          />
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={showToggleDialog}
        title={dealer.status ? 'Deactivate Dealer' : 'Activate Dealer'}
        message={`Are you sure you want to ${dealer.status ? 'deactivate' : 'activate'} ${dealer.dealerName}?`}
        confirmLabel={dealer.status ? 'Deactivate' : 'Activate'}
        confirmVariant={dealer.status ? 'danger' : 'primary'}
        isLoading={isToggling}
        onConfirm={handleToggleStatus}
        onCancel={() => setShowToggleDialog(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing[4], paddingBottom: Spacing[8] },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...Typography.body, color: Colors.error },
  headerCard: { marginBottom: Spacing[3] },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerInfo: { flex: 1, marginLeft: Spacing[3] },
  dealerName: { ...Typography.h4, color: Colors.textPrimary },
  dealerCity: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing[3] },
  sectionTitle: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing[3] },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { ...Typography.caption, color: Colors.textSecondary },
  infoValue: { ...Typography.caption, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  actions: { marginTop: Spacing[2] },
  toggleBtn: { marginTop: Spacing[3] },
  editBtn: { marginTop: Spacing[3] },
});

export default DealerDetailScreen;
