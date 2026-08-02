import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, DashboardResponse } from '@types';
import { ReportService } from '@services/reportService';
import { useToast, useLanguage, useTheme } from '@context';
import { useAuth } from '@hooks';
import { formatDate } from '@utils';
import { Typography, Spacing, BorderRadius, Shadows, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';
import { useLayoutMetrics } from '@theme/layout';
import { PortalHeader, StatusChip, EmptyState } from '@components/common';
import Screen from '@components/layout/Screen';
import AppLoader from '@components/loaders/AppLoader';
import AppCard from '@components/cards/AppCard';

type NavProp = NativeStackNavigationProp<AppStackParamList>;
type IonName = React.ComponentProps<typeof Ionicons>['name'];

const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral'> = {
    Pending: 'warning',
    Confirmed: 'info',
    Processing: 'primary',
    Shipped: 'primary',
    Delivered: 'success',
    Cancelled: 'error',
  };
  return map[status] ?? 'neutral';
};

const DashboardScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const { showError } = useToast();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { scrollBottomPad } = useLayoutMetrics();
  const styles = useThemedStyles(createDashStyles);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const goTo = useCallback(
    (screen: keyof AppStackParamList, params?: object) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate(screen, params);
    },
    [navigation],
  );

  const loadData = useCallback(async () => {
    try {
      const dashRes = await ReportService.getDashboard();
      setData(dashRes);
    } catch {
      setData({
        stats: {
          totalOrders: 0,
          pendingOrders: 0,
          availableCredit: 0,
          creditExpiry: null,
          ordersThisMonth: 0,
        },
        recentOrders: [],
        supportPhone: '+966 11 234 5678',
        supportEmail: 'support@ucic.com',
      });
      showError('Error', 'Failed to load dashboard. Logout and login again, then pull to refresh.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) return <AppLoader message={t('loadingDashboard')} />;

  const stats = data?.stats;
  const recentOrders = data?.recentOrders ?? [];
  const deliveredApprox = Math.max(0, (stats?.totalOrders ?? 0) - (stats?.pendingOrders ?? 0));

  const quick: { icon: IonName; label: string; color: string; onPress: () => void }[] = [
    {
      icon: 'mic',
      label: 'Voice',
      color: colors.primary,
      onPress: () => goTo('CreateOrder', { mode: 'voice' }),
    },
    {
      icon: 'add-circle',
      label: t('newOrder'),
      color: colors.accent,
      onPress: () => goTo('CreateOrder', { mode: 'manual' }),
    },
    {
      icon: 'cube-outline',
      label: t('orders'),
      color: colors.success,
      onPress: () => navigation.navigate('Orders' as never),
    },
    {
      icon: 'headset-outline',
      label: t('support'),
      color: colors.primaryDark,
      onPress: () => navigation.navigate('Support' as never),
    },
  ];

  const name =
    (isRTL ? user?.customerNameAr || user?.fullName : user?.fullName || user?.customerNameAr) ||
    'Dealer';
  const nameIsArabic = /[\u0600-\u06FF]/.test(name);

  return (
    <Screen edges={['top']}>
      <PortalHeader />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPad + 80 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcome}>
          <Text style={[styles.hello, (isRTL || nameIsArabic) && styles.rtl]}>
            {t('welcomeBanner')}
          </Text>
          <Text
            style={[styles.name, (isRTL || nameIsArabic) && styles.rtl]}
            numberOfLines={3}
          >
            {name}
          </Text>
        </View>

        <View style={styles.kpiGrid}>
          <Kpi
            title={t('availableCredit')}
            value={Number(stats?.availableCredit ?? 0).toFixed(2)}
            icon="wallet-outline"
            tint={colors.success}
            isRTL={isRTL}
            styles={styles}
          />
          <Kpi
            title={t('pendingOrders')}
            value={String(stats?.pendingOrders ?? 0)}
            icon="time-outline"
            tint={colors.warning}
            isRTL={isRTL}
            styles={styles}
          />
          <Kpi
            title={t('deliveredOrders')}
            value={String(deliveredApprox)}
            icon="checkmark-done-outline"
            tint={colors.primary}
            isRTL={isRTL}
            styles={styles}
          />
          <Kpi
            title={t('totalOrders')}
            value={String(stats?.totalOrders ?? 0)}
            icon="layers-outline"
            tint={colors.primaryDark}
            isRTL={isRTL}
            styles={styles}
          />
        </View>

        <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>{t('quickActions')}</Text>
        <View style={styles.quickRow}>
          {quick.map(q => (
            <TouchableOpacity key={q.label} style={styles.quickBtn} onPress={q.onPress} activeOpacity={0.85}>
              <View style={[styles.quickIcon, { backgroundColor: q.color + '18' }]}>
                <Ionicons name={q.icon} size={22} color={q.color} />
              </View>
              <Text style={styles.quickLabel} numberOfLines={1}>
                {q.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
          <Text style={styles.sectionTitleInline}>{t('recentOrders')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders' as never)}>
            <Text style={styles.link}>{t('viewAllOrders')}</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <AppCard shadow="sm">
            <EmptyState title={t('noRecentOrders')} message={t('noRecentOrdersMsg')} />
          </AppCard>
        ) : (
          recentOrders.map(order => (
            <AppCard
              key={order.orderId}
              style={styles.orderCard}
              shadow="sm"
              onPress={() => goTo('OrderDetail', { orderId: order.orderId })}
            >
              <View style={[styles.orderTop, isRTL && styles.rowReverse]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.coupon, isRTL && styles.rtl]}>
                    {order.couponNumber ?? `#${order.orderId}`}
                  </Text>
                  <Text style={[styles.orderMeta, isRTL && styles.rtl]}>
                    {formatDate(order.orderDate)} · {order.deliveryArea ?? '—'}
                  </Text>
                </View>
                <StatusChip label={order.status} type={getStatusType(order.status)} />
              </View>
              <View style={[styles.orderBottom, isRTL && styles.rowReverse]}>
                <Text style={styles.orderMeta}>
                  {t('erpOrder')}: {order.erpOrderNumber ?? t('noErpOrder')}
                </Text>
                <Text style={styles.orderMeta}>
                  {t('vehicle')}: {order.vehicle ?? '—'}
                </Text>
              </View>
            </AppCard>
          ))
        )}
      </ScrollView>
    </Screen>
  );
};

const Kpi = ({
  title,
  value,
  icon,
  tint,
  isRTL,
  styles,
}: {
  title: string;
  value: string;
  icon: IonName;
  tint: string;
  isRTL?: boolean;
  styles: ReturnType<typeof createDashStyles>;
}) => (
  <View style={[styles.kpi, Shadows.sm as object]}>
    <View style={[styles.kpiTop, isRTL && styles.rowReverse]}>
      <View style={[styles.kpiIcon, { backgroundColor: tint + '18' }]}>
        <Ionicons name={icon} size={14} color={tint} />
      </View>
    </View>
    <Text style={[styles.kpiValue, { color: tint }, isRTL && styles.rtl]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={[styles.kpiTitle, isRTL && styles.rtl]} numberOfLines={2}>
      {title}
    </Text>
  </View>
);

const createDashStyles = (c: AppColors) =>
  StyleSheet.create({
    container: { padding: Spacing[4] },
    rtl: { textAlign: 'right', writingDirection: 'rtl' },
    rowReverse: { flexDirection: 'row-reverse' },
    welcome: {
      backgroundColor: c.primaryDark,
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing[4],
      paddingHorizontal: Spacing[4],
      marginBottom: Spacing[3],
      overflow: 'hidden',
      ...(Shadows.md as object),
    },
    hello: { ...Typography.caption, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
    name: {
      ...Typography.h5,
      color: c.white,
      fontWeight: '700',
      lineHeight: 24,
      flexShrink: 1,
    },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing[2],
      marginBottom: Spacing[4],
    },
    kpi: {
      width: '48%',
      flexGrow: 1,
      maxWidth: '48.5%',
      backgroundColor: c.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing[2],
      paddingHorizontal: Spacing[3],
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    kpiTop: { flexDirection: 'row', marginBottom: Spacing[1] },
    kpiIcon: {
      width: 28,
      height: 28,
      borderRadius: BorderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kpiValue: { ...Typography.h5, fontWeight: '700', marginBottom: 1 },
    kpiTitle: { ...Typography.caption, color: c.textSecondary, fontSize: 11 },
    sectionTitle: {
      ...Typography.h5,
      color: c.textPrimary,
      marginBottom: Spacing[3],
    },
    sectionTitleInline: { ...Typography.h5, color: c.textPrimary },
    quickRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing[5],
      gap: Spacing[2],
    },
    quickBtn: { flex: 1, alignItems: 'center' },
    quickIcon: {
      width: 52,
      height: 52,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing[2],
    },
    quickLabel: { ...Typography.caption, color: c.textSecondary, fontWeight: '600' },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing[3],
    },
    link: { ...Typography.label, color: c.primary },
    orderCard: { marginBottom: Spacing[3] },
    orderTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing[3],
      marginBottom: Spacing[2],
    },
    coupon: { ...Typography.h5, color: c.textPrimary },
    orderMeta: { ...Typography.caption, color: c.textSecondary, marginTop: 2 },
    orderBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingTop: Spacing[2],
      marginTop: Spacing[1],
    },
  });

export default DashboardScreen;
