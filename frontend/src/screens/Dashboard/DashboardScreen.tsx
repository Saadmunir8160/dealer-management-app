import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, DashboardResponse } from '@types';
import { ReportService } from '@services/reportService';
import { useToast, useLanguage } from '@context';
import { formatDate } from '@utils';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import { PortalHeader, StatusChip, EmptyState } from '@components/common';
import AppLoader from '@components/loaders/AppLoader';
import AppCard from '@components/cards/AppCard';

type NavProp = NativeStackNavigationProp<AppStackParamList>;

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
  const { showError } = useToast();
  const { t, isRTL } = useLanguage();
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
      // Keep UI usable; toast explains API/auth failure (re-login often fixes it)
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PortalHeader />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.banner}>
          <Text style={[styles.bannerTitle, isRTL && styles.rtlText]}>{t('welcomeBanner')}</Text>
        </View>

        <View style={styles.statsRow}>
          <KpiCard
            title={t('totalOrders')}
            value={String(stats?.totalOrders ?? 0)}
            hint={`+${stats?.ordersThisMonth ?? 0} ${t('thisMonth')}`}
            accent={Colors.primary}
            icon="🚚"
            isRTL={isRTL}
          />
          <KpiCard
            title={t('pendingOrders')}
            value={String(stats?.pendingOrders ?? 0)}
            hint={t('inProgress')}
            accent={Colors.warning}
            icon="⏳"
            isRTL={isRTL}
          />
          <KpiCard
            title={t('availableCredit')}
            value={Number(stats?.availableCredit ?? 0).toFixed(2)}
            hint={stats?.creditExpiry ? formatDate(stats.creditExpiry, 'MMM dd, yyyy') : '—'}
            accent={Colors.success}
            icon="💳"
            isRTL={isRTL}
          />
        </View>

        <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
          <Text style={styles.sectionTitle}>{t('recentOrders')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Orders' as never)}>
            <Text style={styles.link}>{t('viewAllOrders')}</Text>
          </TouchableOpacity>
        </View>

        <AppCard style={styles.tableCard}>
          <View style={[styles.tableHead, isRTL && styles.rowReverse]}>
            <Text style={[styles.th, styles.colCoupon]}>{t('coupon')}</Text>
            <Text style={[styles.th, styles.colStatus]}>{t('status')}</Text>
            <Text style={[styles.th, styles.colArea]}>{t('area')}</Text>
          </View>
          {recentOrders.length === 0 ? (
            <EmptyState title={t('noRecentOrders')} message={t('noRecentOrdersMsg')} />
          ) : (
            recentOrders.map(order => (
              <TouchableOpacity
                key={order.orderId}
                style={styles.orderBlock}
                onPress={() => goTo('OrderDetail', { orderId: order.orderId })}
              >
                <View style={[styles.tableRow, isRTL && styles.rowReverse]}>
                  <View style={styles.colCoupon}>
                    <Text style={[styles.coupon, isRTL && styles.rtlText]}>{order.couponNumber ?? `#${order.orderId}`}</Text>
                    <Text style={[styles.meta, isRTL && styles.rtlText]}>{formatDate(order.orderDate)}</Text>
                  </View>
                  <View style={styles.colStatus}>
                    <StatusChip label={order.status} type={getStatusType(order.status)} />
                  </View>
                  <View style={styles.colArea}>
                    <Text style={[styles.meta, isRTL && styles.rtlText]} numberOfLines={1}>{order.deliveryArea ?? '—'}</Text>
                    <Text style={[styles.meta, isRTL && styles.rtlText]} numberOfLines={1}>{order.driver ?? t('noDriver')}</Text>
                  </View>
                </View>
                <View style={[styles.ucicRow, isRTL && styles.rowReverse]}>
                  <Text style={[styles.ucicItem, isRTL && styles.rtlText]}>
                    {t('erpOrder')}: {order.erpOrderNumber ?? t('noErpOrder')}
                  </Text>
                  <Text style={[styles.ucicItem, isRTL && styles.rtlText]}>
                    {t('vehicle')}: {order.vehicle ?? '—'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </AppCard>

        <AppCard style={styles.helpCard}>
          <Text style={[styles.helpTitle, isRTL && styles.rtlText]}>{t('needHelp')}</Text>
          <Text style={[styles.helpText, isRTL && styles.rtlText]}>{t('needHelpMsg')}</Text>
          <Text style={[styles.helpContact, isRTL && styles.rtlText]}>{data?.supportPhone ?? '+966 11 234 5678'}</Text>
          <Text style={[styles.helpContact, isRTL && styles.rtlText]}>{data?.supportEmail ?? 'support@ucic.com'}</Text>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => navigation.navigate('Support' as never)}
          >
            <Text style={styles.helpBtnText}>{t('contactSupport')}</Text>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const KpiCard = ({
  title,
  value,
  hint,
  accent,
  icon,
  isRTL,
}: {
  title: string;
  value: string;
  hint: string;
  accent: string;
  icon: string;
  isRTL?: boolean;
}) => (
  <View style={styles.kpi}>
    <View style={[styles.kpiTop, isRTL && styles.rowReverse]}>
      <Text style={[styles.kpiTitle, isRTL && styles.rtlText]}>{title}</Text>
      <View style={[styles.kpiIcon, { backgroundColor: accent + '18' }]}>
        <Text>{icon}</Text>
      </View>
    </View>
    <Text style={[styles.kpiValue, { color: accent }, isRTL && styles.rtlText]}>{value}</Text>
    <Text style={[styles.kpiHint, isRTL && styles.rtlText]}>{hint}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing[4], paddingBottom: Spacing[8] },
  banner: {
    backgroundColor: Colors.primaryBanner,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
    marginBottom: Spacing[4],
  },
  bannerTitle: { ...Typography.h5, color: Colors.white },
  statsRow: { gap: Spacing[3], marginBottom: Spacing[4] },
  kpi: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kpiTitle: { ...Typography.label, color: Colors.textSecondary },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: { ...Typography.h3, marginTop: Spacing[2] },
  kpiHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: { ...Typography.h5, color: Colors.textPrimary },
  link: { ...Typography.label, color: Colors.primary },
  tableCard: { padding: 0, overflow: 'hidden', marginBottom: Spacing[4] },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  orderBlock: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ucicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[3],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
  },
  ucicItem: { ...Typography.caption, color: Colors.textSecondary, flex: 1 },
  colCoupon: { flex: 1.2 },
  colStatus: { flex: 1, alignItems: 'flex-start' },
  colArea: { flex: 1 },
  coupon: { ...Typography.label, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  helpCard: { marginBottom: Spacing[4] },
  helpTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing[1] },
  helpText: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing[3] },
  helpContact: { ...Typography.label, color: Colors.textPrimary, marginBottom: 2 },
  helpBtn: {
    marginTop: Spacing[4],
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  helpBtnText: { ...Typography.button, color: Colors.white },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});

export default DashboardScreen;
