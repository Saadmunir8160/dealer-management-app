import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadows } from '@theme';
import { useAuth } from '@hooks';
import { useLanguage, useTheme } from '@context';

interface PortalHeaderProps {
  onLogoutPress?: () => void;
}

const PortalHeader: React.FC<PortalHeaderProps> = ({ onLogoutPress }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t, isRTL } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        !isDark ? (Shadows.sm as object) : null,
      ]}
    >
      <View style={[styles.brandRow, isRTL && styles.rowReverse]}>
        <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
          <Text style={[styles.logoLetter, { color: colors.white }]}>U</Text>
        </View>
        <View style={styles.brandText}>
          <Text
            style={[styles.brandEn, { color: colors.textPrimary }, isRTL && styles.alignEnd]}
            numberOfLines={2}
          >
            {isRTL ? t('brandAr') : t('brandEn')}
          </Text>
          <Text
            style={[styles.brandAr, { color: colors.textSecondary }, isRTL && styles.alignEnd]}
            numberOfLines={2}
          >
            {isRTL ? t('brandEn') : t('brandAr')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onLogoutPress ?? logout}
          style={[styles.iconBtn, { backgroundColor: colors.errorLight }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t('logout')}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={[styles.actions, isRTL && styles.rowReverse]}>
        <Text
          style={[
            styles.userName,
            { color: colors.textSecondary },
            isRTL && styles.alignEnd,
            { writingDirection: 'rtl', textAlign: isRTL ? 'right' : 'left' },
          ]}
          numberOfLines={2}
        >
          {isRTL
            ? user?.customerNameAr || user?.fullName || 'Dealer'
            : user?.fullName || user?.customerNameAr || 'Dealer'}
        </Text>
        <View style={[styles.langRow, { backgroundColor: colors.gray200 }]}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && { backgroundColor: colors.primary }]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.8}
          >
            <Text
              style={
                language === 'en'
                  ? [styles.langActiveText, { color: colors.white }]
                  : [styles.langText, { color: colors.textSecondary }]
              }
            >
              EN
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'ar' && { backgroundColor: colors.primary }]}
            onPress={() => setLanguage('ar')}
            activeOpacity={0.8}
          >
            <Text
              style={
                language === 'ar'
                  ? [styles.langActiveText, { color: colors.white }]
                  : [styles.langText, { color: colors.textSecondary }]
              }
            >
              عربي
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { textAlign: 'right' },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontWeight: '800',
    fontSize: 18,
  },
  brandText: { flex: 1, minWidth: 0, paddingRight: Spacing[1] },
  brandEn: {
    ...Typography.caption,
    fontWeight: '700',
    flexShrink: 1,
  },
  brandAr: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    flexShrink: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  userName: {
    flex: 1,
    minWidth: 0,
    ...Typography.caption,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  langRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langActiveText: {
    fontSize: 12,
    fontWeight: '700',
  },
  langText: {
    fontSize: 12,
  },
});

export default PortalHeader;
