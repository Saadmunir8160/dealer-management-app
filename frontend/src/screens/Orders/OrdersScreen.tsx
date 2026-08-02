import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, OrderSummary, OrderStatus } from '@types';
import { OrderService } from '@services/orderService';
import { useToast, useLanguage, useTheme } from '@context';
import { formatDate } from '@utils';
import { Typography, Spacing, BorderRadius, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';
import { useLayoutMetrics } from '@theme/layout';
import { PortalHeader, StatusChip, EmptyState } from '@components/common';
import Screen from '@components/layout/Screen';
import SkeletonLoader from '@components/loaders/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';

type NavProp = NativeStackNavigationProp<AppStackParamList>;

const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral'> = {
    Pending: 'warning', Confirmed: 'info', Processing: 'primary',
    Shipped: 'primary', Delivered: 'success', Cancelled: 'error',
  };
  return map[status] ?? 'neutral';
};

const OrdersScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { showError } = useToast();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { scrollBottomPad } = useLayoutMetrics();
  const styles = useThemedStyles(createOrderStyles);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  /** Bubble to App stack (CreateOrder / OrderDetail live above BottomTabs). */
  const goTo = useCallback(
    (screen: keyof AppStackParamList, params?: object) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate(screen, params);
    },
    [navigation],
  );

  const STATUS_FILTERS: { label: string; value: OrderStatus | 'all' }[] = [
    { label: t('allStatus'), value: 'all' },
    { label: 'Pending', value: 'Pending' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Processing', value: 'Processing' },
    { label: 'Shipped', value: 'Shipped' },
    { label: 'Delivered', value: 'Delivered' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  const loadOrders = useCallback(async () => {
    try {
      const res = await OrderService.fetchOrders({
        page: 1,
        limit: 50,
        status: filter === 'all' ? undefined : filter,
      } as any);
      setOrders(res.data ?? []);
    } catch {
      showError('Error', 'Failed to load orders');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [filter, showError]);

  useEffect(() => {
    setIsLoading(true);
    loadOrders();
  }, [loadOrders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      (o.couponNumber ?? '').toLowerCase().includes(q) ||
      (o.erpOrderNumber ?? '').toLowerCase().includes(q) ||
      (o.dealerName ?? '').toLowerCase().includes(q) ||
      (o.deliveryArea ?? '').toLowerCase().includes(q),
    );
  }, [orders, search]);

  const renderOrder = useCallback(
    ({ item }: { item: OrderSummary }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => goTo('OrderDetail', { orderId: item.orderId })}
        activeOpacity={0.7}
      >
        <View style={[styles.cardTop, isRTL && styles.rowReverse]}>
          <View>
            <Text style={[styles.coupon, isRTL && styles.rtlText]}>{item.couponNumber ?? `ORD-${item.orderId}`}</Text>
            <Text style={[styles.erp, isRTL && styles.rtlText]}>{item.erpOrderNumber ?? t('noErpOrder')}</Text>
          </View>
          <StatusChip label={item.status} type={getStatusType(item.status)} />
        </View>
        <View style={styles.metaGrid}>
          <Meta label={t('date')} value={formatDate(item.orderDate)} isRTL={isRTL} styles={styles} />
          <Meta label={t('items')} value={String(item.itemCount ?? '—')} isRTL={isRTL} styles={styles} />
          <Meta label={t('deliveryArea')} value={item.deliveryArea ?? '—'} isRTL={isRTL} styles={styles} />
          <Meta label={t('driver')} value={item.driver ?? '—'} isRTL={isRTL} styles={styles} />
          <Meta label={t('vehicle')} value={item.vehicle ?? '—'} isRTL={isRTL} styles={styles} />
        </View>
      </TouchableOpacity>
    ),
    [goTo, t, isRTL, styles],
  );

  return (
    <Screen edges={['top']}>
      <PortalHeader />
      <View style={[styles.pageHeader, isRTL && styles.rowReverse]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{t('orderOverview')}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('orderOverviewSubtitle')}</Text>
        </View>
        <TouchableOpacity
          style={[styles.newOrderBtn, styles.voiceOrderBtn]}
          onPress={() => goTo('CreateOrder', { mode: 'voice' })}
        >
          <Ionicons name="mic" size={16} color={colors.white} />
          <Text style={styles.newOrderText}>Voice</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.newOrderBtn}
          onPress={() => goTo('CreateOrder', { mode: 'manual' })}
        >
          <Text style={styles.newOrderText}>+ {t('newOrder')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={[styles.search, isRTL && styles.rtlText]}
          placeholder={t('searchOrders')}
          placeholderTextColor={colors.textDisabled}
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={i => i.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
          inverted={isRTL}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, filter === item.value && styles.chipActive]}
              onPress={() => setFilter(item.value)}
            >
              <Text style={[styles.chipText, filter === item.value && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.orderId)}
          renderItem={renderOrder}
          contentContainerStyle={[styles.list, { paddingBottom: scrollBottomPad + 88 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              title={t('noOrdersFound')}
              message={t('noOrdersMsg')}
            />
          }
        />
      )}
    </Screen>
  );
};

const Meta = ({
  label,
  value,
  isRTL,
  styles,
}: {
  label: string;
  value: string;
  isRTL?: boolean;
  styles: ReturnType<typeof createOrderStyles>;
}) => (
  <View style={styles.metaItem}>
    <Text style={[styles.metaLabel, isRTL && styles.rtlText]}>{label}</Text>
    <Text style={[styles.metaValue, isRTL && styles.rtlText]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const createOrderStyles = (c: AppColors) =>
  StyleSheet.create({
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing[4],
      paddingTop: Spacing[3],
      paddingBottom: Spacing[2],
      gap: Spacing[3],
    },
    title: { ...Typography.h4, color: c.textPrimary },
    subtitle: { ...Typography.bodySmall, color: c.textSecondary, marginTop: 2 },
    newOrderBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: c.accent,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[2],
    },
    voiceOrderBtn: {
      backgroundColor: c.primary,
    },
    newOrderText: { ...Typography.label, color: c.white, fontWeight: '700' },
    filters: {
      paddingHorizontal: Spacing[4],
      marginBottom: Spacing[2],
      gap: Spacing[2],
    },
    search: {
      backgroundColor: c.surface,
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      color: c.textPrimary,
    },
    filterChips: { gap: Spacing[2], paddingVertical: Spacing[1] },
    chip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[2],
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { ...Typography.caption, color: c.textSecondary, fontWeight: '600' },
    chipTextActive: { color: c.white, fontWeight: '700' },
    list: { padding: Spacing[4], paddingTop: Spacing[2] },
    card: {
      backgroundColor: c.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: Spacing[4],
      marginBottom: Spacing[3],
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Spacing[3],
    },
    coupon: { ...Typography.h5, color: c.textPrimary },
    erp: { ...Typography.caption, color: c.textSecondary, marginTop: 2 },
    metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[3] },
    metaItem: { width: '45%' },
    metaLabel: { ...Typography.caption, color: c.textSecondary },
    metaValue: { ...Typography.label, color: c.textPrimary, marginTop: 2 },
    rowReverse: { flexDirection: 'row-reverse' },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  });

export default OrdersScreen;
