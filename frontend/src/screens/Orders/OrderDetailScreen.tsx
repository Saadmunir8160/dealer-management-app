// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Orders/OrderDetailScreen.tsx
// Full order view with items, status, and cancel action.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, Order } from '@types';
import { OrderService } from '@services/orderService';
import { useToast } from '@context';
import { formatCurrency, formatDate } from '@utils';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppCard from '@components/cards/AppCard';
import AppButton from '@components/buttons/AppButton';
import { StatusChip } from '@components/common';
import AppLoader from '@components/loaders/AppLoader';
import ConfirmationDialog from '@components/modals/ConfirmationDialog';

type Props = NativeStackScreenProps<AppStackParamList, 'OrderDetail'>;

const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral'> = {
    Pending: 'warning', Confirmed: 'info', Processing: 'primary',
    Shipped: 'primary', Delivered: 'success', Cancelled: 'error',
  };
  return map[status] ?? 'neutral';
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value}</Text>
  </View>
);

const OrderDetailScreen: React.FC<Props> = ({ route }) => {
  const { orderId } = route.params;
  const { showSuccess, showError } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    OrderService.fetchOrderById(String(orderId))
      .then(setOrder)
      .catch(() => showError('Error', 'Failed to load order'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const updated = await OrderService.cancelOrder(String(orderId));
      setOrder(updated);
      showSuccess('Cancelled', 'Order has been cancelled');
    } catch {
      showError('Error', 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  if (isLoading) return <AppLoader message="Loading order..." />;
  if (!order) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const canCancel = order.status !== 'Cancelled' && order.status !== 'Delivered';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <AppCard style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.orderTitle}>Order #{order.orderId}</Text>
              <Text style={styles.dealerName}>{order.dealerName}</Text>
            </View>
            <StatusChip label={order.status} type={getStatusType(order.status)} />
          </View>
        </AppCard>

        {/* ── Details ────────────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <Row label="Order Date" value={formatDate(order.orderDate, 'dd MMM yyyy, hh:mm a')} />
          <Row label="Sales Person" value={order.salesPerson} />
          <Row label="Items" value={String(order.items.length)} />
          <Row label="Total Amount" value={formatCurrency(order.totalAmount)} />
        </AppCard>

        {/* ── Items ──────────────────────────────────────────────────── */}
        <AppCard style={styles.section}>
          <Text style={styles.sectionTitle}>Items ({order.items.length})</Text>
          {order.items.map((item, idx) => (
            <View
              key={item.orderItemId}
              style={[styles.itemRow, idx < order.items.length - 1 && styles.itemBorder]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>
                  Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.itemTotal}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(order.totalAmount)}</Text>
          </View>
        </AppCard>

        {/* ── Cancel Button ──────────────────────────────────────────── */}
        {canCancel && (
          <AppButton
            title="Cancel Order"
            onPress={() => setShowCancelDialog(true)}
            variant="danger"
            fullWidth
            size="lg"
          />
        )}
      </ScrollView>

      <ConfirmationDialog
        visible={showCancelDialog}
        title="Cancel Order"
        message={`Are you sure you want to cancel Order #${order.orderId}? This action cannot be undone.`}
        confirmLabel="Cancel Order"
        confirmVariant="danger"
        isLoading={isCancelling}
        onConfirm={handleCancel}
        onCancel={() => setShowCancelDialog(false)}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderTitle: { ...Typography.h4, color: Colors.textPrimary },
  dealerName: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing[3] },
  sectionTitle: { ...Typography.label, color: Colors.textPrimary, marginBottom: Spacing[3] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLabel: { ...Typography.caption, color: Colors.textSecondary },
  rowValue: { ...Typography.caption, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing[3] },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  itemInfo: { flex: 1 },
  itemName: { ...Typography.label, color: Colors.textPrimary },
  itemMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  itemTotal: { ...Typography.label, color: Colors.textPrimary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: Spacing[4], marginTop: Spacing[2] },
  totalLabel: { ...Typography.h5, color: Colors.textPrimary },
  totalValue: { ...Typography.h5, color: Colors.primary },
});

export default OrderDetailScreen;
