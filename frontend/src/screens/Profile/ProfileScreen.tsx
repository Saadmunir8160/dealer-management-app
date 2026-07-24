import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '@types';
import { useAuth } from '@hooks';
import { useLanguage } from '@context';
import { formatDate } from '@utils';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import { PortalHeader } from '@components/common';
import AppCard from '@components/cards/AppCard';
import LogoutDialog from '@components/modals/LogoutDialog';

type NavProp = NativeStackNavigationProp<AppStackParamList>;

const ProfileScreen: React.FC = () => {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const navigation = useNavigation<NavProp>();
  const [showLogout, setShowLogout] = useState(false);

  const goTo = (screen: keyof AppStackParamList, params?: object) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate(screen, params);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PortalHeader onLogoutPress={() => setShowLogout(true)} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>{t('customerProfile')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
          {t('customerProfileSubtitle')}
        </Text>

        <AppCard style={styles.card}>
          <View style={[styles.cardHeader, isRTL && styles.rowReverse]}>
            <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t('customerInformation')}</Text>
            <TouchableOpacity
              style={styles.changePwdBtn}
              onPress={() => goTo('ChangePassword')}
            >
              <Text style={styles.changePwdText}>{t('changePassword')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            <InfoBlock title={t('basicInformation')} isRTL={isRTL}>
              <Row label={t('customerName')} value={user.customerNameAr || user.fullName} isRTL={isRTL} />
              <Row label={t('customerCode')} value={user.customerCode || 'N/A'} isRTL={isRTL} />
              <Row label={t('lnCode')} value={user.lnCode || 'N/A'} isRTL={isRTL} />
              <Row label={t('verificationStatus')} value={user.verificationStatus || 'Not Verified'} isRTL={isRTL} />
            </InfoBlock>

            <InfoBlock title={t('financialInformation')} isRTL={isRTL}>
              <Row
                label={t('availableCredit')}
                value={Number(user.availableCredit ?? 0).toFixed(2)}
                isRTL={isRTL}
              />
              <Row
                label={t('creditExpiry')}
                value={user.creditExpiry ? formatDate(user.creditExpiry, 'MMM dd, yyyy') : '—'}
                isRTL={isRTL}
              />
            </InfoBlock>

            <InfoBlock title={t('userAccountDetails')} isRTL={isRTL}>
              <Row label={t('fullName')} value={user.fullName} isRTL={isRTL} />
              <Row label={t('email')} value={user.email} isRTL={isRTL} />
              <Row label={t('phoneNumber')} value={user.phone || '—'} isRTL={isRTL} />
              <Row label={t('username')} value={user.username || user.email} isRTL={isRTL} />
              <Row label={t('roles')} value={user.role} isRTL={isRTL} />
            </InfoBlock>

            <InfoBlock title={t('accountInformation')} isRTL={isRTL}>
              <Row
                label={t('createdAt')}
                value={formatDate(user.createdDate, 'MMM dd, yyyy, h:mm:ss a')}
                isRTL={isRTL}
              />
            </InfoBlock>
          </View>
        </AppCard>
      </ScrollView>

      <LogoutDialog
        visible={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </SafeAreaView>
  );
};

const InfoBlock = ({
  title,
  children,
  isRTL,
}: {
  title: string;
  children: React.ReactNode;
  isRTL?: boolean;
}) => (
  <View style={styles.block}>
    <Text style={[styles.blockTitle, isRTL && styles.rtlText]}>{title}</Text>
    {children}
  </View>
);

const Row = ({
  label,
  value,
  isRTL,
}: {
  label: string;
  value: string;
  isRTL?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={[styles.label, isRTL && styles.rtlText]}>{label}</Text>
    <Text style={[styles.value, isRTL && styles.rtlText]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing[4], paddingBottom: Spacing[8] },
  title: { ...Typography.h4, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing[4] },
  card: { padding: Spacing[4] },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
    gap: Spacing[2],
  },
  cardTitle: { ...Typography.h5, color: Colors.textPrimary, flex: 1 },
  changePwdBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  changePwdText: { ...Typography.label, color: Colors.white, fontWeight: '700' },
  grid: { gap: Spacing[4] },
  block: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
  },
  blockTitle: {
    ...Typography.label,
    color: Colors.primary,
    marginBottom: Spacing[3],
    fontWeight: '700',
  },
  row: { marginBottom: Spacing[2] },
  label: { ...Typography.caption, color: Colors.textSecondary },
  value: { ...Typography.body, color: Colors.textPrimary, marginTop: 2 },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});

export default ProfileScreen;
