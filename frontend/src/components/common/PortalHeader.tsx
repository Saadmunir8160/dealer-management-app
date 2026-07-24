import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Colors, Typography, Spacing } from '@theme';
import { useAuth } from '@hooks';
import { useLanguage } from '@context';

interface PortalHeaderProps {
  onLogoutPress?: () => void;
}

const PortalHeader: React.FC<PortalHeaderProps> = ({ onLogoutPress }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();

  return (
    <View style={[styles.wrap, isRTL && styles.rtlText]}>
      <View style={[styles.brandRow, isRTL && styles.rowReverse]}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>U</Text>
        </View>
        <View style={styles.brandText}>
          <Text style={[styles.brandEn, isRTL && styles.alignEnd]} numberOfLines={1}>
            {isRTL ? t('brandAr') : t('brandEn')}
          </Text>
          <Text style={[styles.brandAr, isRTL && styles.alignEnd]} numberOfLines={1}>
            {isRTL ? t('brandEn') : t('brandAr')}
          </Text>
        </View>
      </View>

      <View style={[styles.actions, isRTL && styles.rowReverse]}>
        <Text style={[styles.userName, isRTL && styles.alignEnd]} numberOfLines={1}>
          {isRTL
            ? user?.customerNameAr || user?.fullName || 'Dealer'
            : user?.fullName || user?.customerNameAr || 'Dealer'}
        </Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langActive]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.8}
          >
            <Text style={language === 'en' ? styles.langActiveText : styles.langText}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'ar' && styles.langActive]}
            onPress={() => setLanguage('ar')}
            activeOpacity={0.8}
          >
            <Text style={language === 'ar' ? styles.langActiveText : styles.langText}>عربي</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onLogoutPress ?? logout}
          style={styles.logoutBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  rtlText: {
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  alignEnd: {
    textAlign: 'right',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 18,
  },
  brandText: { flex: 1 },
  brandEn: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  brandAr: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  userName: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  langRow: {
    flexDirection: 'row',
    backgroundColor: Colors.gray200,
    borderRadius: 8,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langActive: {
    backgroundColor: Colors.primary,
  },
  langActiveText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  langText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  logoutBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PortalHeader;
