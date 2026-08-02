import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '@types';
import { useAuth } from '@hooks';
import { useLanguage, useToast } from '@context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@theme';
import { useLayoutMetrics } from '@theme/layout';
import Screen from '@components/layout/Screen';
import AppCard from '@components/cards/AppCard';
import AppButton from '@components/buttons/AppButton';
import { PortalHeader } from '@components/common';
import { formatDate } from '@utils';

type NavProp = NativeStackNavigationProp<AppStackParamList>;

type IonName = React.ComponentProps<typeof Ionicons>['name'];

const AccountScreen = () => {
  const { user, refreshProfile } = useAuth();
  const { t, isRTL } = useLanguage();
  const { showInfo } = useToast();
  const navigation = useNavigation<NavProp>();
  const { scrollBottomPad } = useLayoutMetrics();
  const [refreshing, setRefreshing] = useState(false);

  const credit = Number(user?.availableCredit ?? 0);
  const outstanding = Number(user?.outstandingBalance ?? 0);
  const limit = credit + outstanding || credit;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  const actions: { icon: IonName; label: string; onPress: () => void }[] = [
    {
      icon: 'receipt-outline',
      label: t('invoices'),
      onPress: () => showInfo(t('comingSoon'), t('invoicesSoon')),
    },
    {
      icon: 'card-outline',
      label: t('payments'),
      onPress: () => showInfo(t('comingSoon'), t('paymentsSoon')),
    },
    {
      icon: 'document-text-outline',
      label: t('statements'),
      onPress: () => showInfo(t('comingSoon'), t('statementsSoon')),
    },
    {
      icon: 'download-outline',
      label: t('downloadPdf'),
      onPress: () => showInfo(t('comingSoon'), t('pdfSoon')),
    },
  ];

  return (
    <Screen edges={['top']}>
      <PortalHeader />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPad + 72 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, isRTL && styles.rtl]}>{t('account')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.rtl]}>{t('accountSubtitle')}</Text>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{t('availableCredit')}</Text>
          <Text style={styles.heroValue}>
            {credit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={styles.heroHint}>
            {t('creditExpiry')}:{' '}
            {user?.creditExpiry ? formatDate(user.creditExpiry, 'MMM dd, yyyy') : '—'}
          </Text>
        </View>

        <View style={styles.row}>
          <AppCard style={styles.half} shadow="sm">
            <View style={styles.statIcon}>
              <Ionicons name="trending-up-outline" size={20} color={Colors.success} />
            </View>
            <Text style={styles.statLabel}>{t('creditLimit')}</Text>
            <Text style={styles.statValue}>
              {limit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </Text>
          </AppCard>
          <AppCard style={styles.half} shadow="sm">
            <View style={[styles.statIcon, { backgroundColor: Colors.errorLight }]}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.error} />
            </View>
            <Text style={styles.statLabel}>{t('outstandingBalance')}</Text>
            <Text style={[styles.statValue, { color: Colors.error }]}>
              {outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </AppCard>
        </View>

        <Text style={[styles.section, isRTL && styles.rtl]}>{t('accountActions')}</Text>
        <AppCard style={styles.menuCard} shadow="sm">
          {actions.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                idx < actions.length - 1 && styles.menuBorder,
                isRTL && styles.rowReverse,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={Colors.primary} />
              </View>
              <Text style={[styles.menuLabel, isRTL && styles.rtl]}>{item.label}</Text>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={Colors.gray400}
              />
            </TouchableOpacity>
          ))}
        </AppCard>

        <AppButton
          title={t('contactSupport')}
          onPress={() => navigation.navigate('Support')}
          variant="outline"
          fullWidth
          size="lg"
          style={styles.supportBtn}
        />
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { padding: Spacing[4] },
  title: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing[4] },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  rowReverse: { flexDirection: 'row-reverse' },
  hero: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    marginBottom: Spacing[4],
    ...(Shadows.md as object),
  },
  heroLabel: { ...Typography.label, color: 'rgba(255,255,255,0.75)', marginBottom: Spacing[1] },
  heroValue: { fontSize: 32, fontWeight: '700', color: Colors.white, letterSpacing: -0.5 },
  heroHint: { ...Typography.caption, color: 'rgba(255,255,255,0.65)', marginTop: Spacing[2] },
  row: { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[4] },
  half: { flex: 1 },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  statValue: { ...Typography.h4, color: Colors.textPrimary, marginTop: 4 },
  section: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing[3] },
  menuCard: { padding: 0, overflow: 'hidden', marginBottom: Spacing[4] },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  menuBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { ...Typography.body, color: Colors.textPrimary, flex: 1, fontWeight: '600' },
  supportBtn: { marginTop: Spacing[1] },
});

export default AccountScreen;
