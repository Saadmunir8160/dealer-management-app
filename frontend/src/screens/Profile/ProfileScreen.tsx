import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppStackParamList } from '@types';
import { useAuth } from '@hooks';
import { useLanguage, useTheme } from '@context';
import { formatDate } from '@utils';
import { Typography, Spacing, BorderRadius, Shadows, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';
import { useLayoutMetrics } from '@theme/layout';
import { PortalHeader } from '@components/common';
import Screen from '@components/layout/Screen';
import AppCard from '@components/cards/AppCard';
import LogoutDialog from '@components/modals/LogoutDialog';

type NavProp = NativeStackNavigationProp<AppStackParamList>;
type IonName = React.ComponentProps<typeof Ionicons>['name'];

const formatCredit = (n: number) =>
  `${Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const createStyles = (c: AppColors) =>
  StyleSheet.create({
    container: { padding: Spacing[4] },
    hero: {
      alignItems: 'center',
      marginBottom: Spacing[4],
      paddingVertical: Spacing[2],
    },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing[3],
      ...(Shadows.md as object),
    },
    avatarText: { fontSize: 36, fontWeight: '700', color: c.white },
    heroName: { ...Typography.h4, color: c.textPrimary, textAlign: 'center' },
    heroMeta: { ...Typography.bodySmall, color: c.textSecondary, marginTop: 4 },
    badge: {
      marginTop: Spacing[3],
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[1],
      borderRadius: BorderRadius.full,
      backgroundColor: c.primaryLight,
    },
    badgeText: { ...Typography.caption, color: c.primary, fontWeight: '700' },
    card: { marginBottom: Spacing[4], gap: Spacing[3] },
    cardTitle: { ...Typography.h5, color: c.textPrimary, marginBottom: Spacing[1] },
    block: {
      backgroundColor: c.gray100,
      borderRadius: BorderRadius.lg,
      padding: Spacing[3],
    },
    blockTitle: {
      ...Typography.label,
      color: c.primary,
      marginBottom: Spacing[3],
      fontWeight: '700',
    },
    row: { marginBottom: Spacing[2] },
    label: { ...Typography.caption, color: c.textSecondary },
    value: { ...Typography.body, color: c.textPrimary, marginTop: 2 },
    menuCard: { padding: 0, overflow: 'hidden', marginBottom: Spacing[4] },
    menuRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      gap: Spacing[3],
      minHeight: 56,
    },
    menuBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    menuIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: c.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuLabel: { ...Typography.body, color: c.textPrimary, flex: 1, fontWeight: '600' },
    langRow: { flexDirection: 'row', gap: 6 },
    langChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      backgroundColor: c.gray200,
    },
    langChipOn: { backgroundColor: c.primary },
    langOn: { color: c.white, fontSize: 12, fontWeight: '700' },
    langOff: { color: c.textSecondary, fontSize: 12 },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing[2],
      paddingVertical: Spacing[4],
      borderRadius: BorderRadius.lg,
      backgroundColor: c.errorLight,
      marginBottom: Spacing[4],
    },
    logoutText: { ...Typography.button, color: c.error },
    rowReverse: { flexDirection: 'row-reverse' },
    rtlText: { textAlign: 'right', writingDirection: 'rtl' },
  });

const ProfileScreen: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const { isDark, toggleDark, colors } = useTheme();
  const navigation = useNavigation<NavProp>();
  const { scrollBottomPad } = useLayoutMetrics();
  const styles = useThemedStyles(createStyles);
  const [showLogout, setShowLogout] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      await refreshProfile();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (screen: keyof AppStackParamList, params?: object) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigation as any).navigate(screen, params);
  };

  if (!user) return null;

  const displayName = user.customerNameAr || user.fullName || 'UCIC Customer';
  const initial = (displayName.trim()[0] || 'U').toUpperCase();

  const menu: {
    icon: IonName;
    label: string;
    onPress?: () => void;
    right?: React.ReactNode;
  }[] = [
    {
      icon: 'notifications-outline',
      label: t('notifications'),
      onPress: () => goTo('Notifications'),
    },
    {
      icon: 'lock-closed-outline',
      label: t('changePassword'),
      onPress: () => goTo('ChangePassword'),
    },
    {
      icon: 'settings-outline',
      label: t('settings'),
      onPress: () => goTo('Settings'),
    },
    {
      icon: 'language-outline',
      label: t('language'),
      right: (
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langChip, language === 'en' && styles.langChipOn]}
            onPress={() => setLanguage('en')}
          >
            <Text style={language === 'en' ? styles.langOn : styles.langOff}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langChip, language === 'ar' && styles.langChipOn]}
            onPress={() => setLanguage('ar')}
          >
            <Text style={language === 'ar' ? styles.langOn : styles.langOff}>عربي</Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      icon: 'moon-outline',
      label: t('darkMode'),
      right: (
        <Switch
          value={isDark}
          onValueChange={toggleDark}
          trackColor={{ false: colors.gray300, true: colors.primaryLight }}
          thumbColor={isDark ? colors.primary : colors.gray100}
        />
      ),
    },
  ];

  return (
    <Screen edges={['top']}>
      <PortalHeader onLogoutPress={() => setShowLogout(true)} />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => void loadProfile()}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={[styles.heroName, isRTL && styles.rtlText]} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={[styles.heroMeta, isRTL && styles.rtlText]}>
            {user.email || user.username || '—'}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{user.verificationStatus || 'Customer'}</Text>
          </View>
        </View>

        <AppCard style={styles.card} shadow="sm">
          <Text style={[styles.cardTitle, isRTL && styles.rtlText]}>{t('customerInformation')}</Text>
          {loading && !user.lnCode ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: Spacing[4] }} />
          ) : null}

          <InfoBlock title={t('basicInformation')} isRTL={isRTL} styles={styles}>
            <Row
              label={t('customerName')}
              value={user.customerNameAr || user.fullName || '—'}
              isRTL={isRTL}
              styles={styles}
            />
            <Row label={t('customerCode')} value={user.customerCode || 'N/A'} isRTL={isRTL} styles={styles} />
            <Row label={t('lnCode')} value={user.lnCode || 'N/A'} isRTL={isRTL} styles={styles} />
          </InfoBlock>

          <InfoBlock title={t('financialInformation')} isRTL={isRTL} styles={styles}>
            <Row
              label={t('availableCredit')}
              value={`${formatCredit(Number(user.availableCredit ?? 0))} ر.س.`}
              isRTL={isRTL}
              styles={styles}
            />
            {user.creditExpiry ? (
              <Row
                label={t('creditExpiry')}
                value={formatDate(user.creditExpiry, 'MMM dd, yyyy')}
                isRTL={isRTL}
                styles={styles}
              />
            ) : null}
          </InfoBlock>

          <InfoBlock title={t('accountInformation')} isRTL={isRTL} styles={styles}>
            <Row label={t('phoneNumber')} value={user.phone || '—'} isRTL={isRTL} styles={styles} />
            <Row label={t('roles')} value={user.role || '—'} isRTL={isRTL} styles={styles} />
            <Row
              label={t('createdAt')}
              value={user.createdDate ? formatDate(user.createdDate, 'MMM dd, yyyy') : '—'}
              isRTL={isRTL}
              styles={styles}
            />
          </InfoBlock>
        </AppCard>

        <AppCard style={styles.menuCard} shadow="sm">
          {menu.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuRow,
                idx < menu.length - 1 && styles.menuBorder,
                isRTL && styles.rowReverse,
              ]}
              onPress={item.onPress}
              activeOpacity={item.onPress ? 0.7 : 1}
              disabled={!item.onPress}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, isRTL && styles.rtlText]}>{item.label}</Text>
              {item.right ?? (
                <Ionicons
                  name={isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={18}
                  color={colors.gray400}
                />
              )}
            </TouchableOpacity>
          ))}
        </AppCard>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setShowLogout(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <LogoutDialog visible={showLogout} onClose={() => setShowLogout(false)} />
    </Screen>
  );
};

type Styles = ReturnType<typeof createStyles>;

const InfoBlock = ({
  title,
  children,
  isRTL,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  isRTL?: boolean;
  styles: Styles;
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
  styles,
}: {
  label: string;
  value: string;
  isRTL?: boolean;
  styles: Styles;
}) => (
  <View style={styles.row}>
    <Text style={[styles.label, isRTL && styles.rtlText]}>{label}</Text>
    <Text style={[styles.value, isRTL && styles.rtlText]}>{value}</Text>
  </View>
);

export default ProfileScreen;
