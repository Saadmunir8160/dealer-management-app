// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Settings/SettingsScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Provides app-level configuration options: theme, notifications,
//   language, security, about, and legal information.
//   Enterprise apps always have a settings page for user preferences.
//
// BUSINESS LOGIC:
//   1. Toggle dark mode (persisted in AsyncStorage)
//   2. Toggle push notifications preference
//   3. Change language (future i18n support)
//   4. View app version and about info
//   5. Clear app cache / data
//   6. View privacy policy and terms (opens web view)
//
// NAVIGATION FLOW:
//   Settings ← ProfileScreen menu item
//   Settings → (back) → ProfileScreen
//
// FUTURE API INTEGRATION:
//   GET /api/users/settings → load preferences
//   PUT /api/users/settings → save preferences
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@theme';
import AppCard from '@components/cards/AppCard';

type Props = NativeStackScreenProps<AppStackParamList, 'Settings'>;

// ── Types ──────────────────────────────────────────────────────────────────────
interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'navigate' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (val: boolean) => void;
}

// ── Settings Row ───────────────────────────────────────────────────────────────
interface RowProps {
  item: SettingsItem;
}

const SettingsRow: React.FC<RowProps> = ({ item }) => (
  <TouchableOpacity
    onPress={item.type !== 'toggle' ? item.onPress : undefined}
    style={rowStyles.container}
    activeOpacity={item.type === 'toggle' ? 1 : 0.6}
    disabled={item.type === 'toggle'}
  >
    <View style={rowStyles.iconBox}>
      <Text style={rowStyles.iconText}>{item.icon}</Text>
    </View>

    <View style={rowStyles.content}>
      <Text style={rowStyles.title}>{item.title}</Text>
      {item.subtitle && <Text style={rowStyles.subtitle}>{item.subtitle}</Text>}
    </View>

    {item.type === 'toggle' && (
      <Switch
        value={item.value}
        onValueChange={item.onToggle}
        trackColor={{ false: Colors.gray400, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    )}

    {item.type === 'navigate' && (
      <Text style={rowStyles.chevron}>›</Text>
    )}
  </TouchableOpacity>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary data. Your account data will not be affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing
            Alert.alert('Done', 'Cache cleared successfully');
          },
        },
      ],
    );
  }, []);

  const settingsSections: SettingsSection[] = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'darkMode',
          icon: '🌙',
          title: 'Dark Mode',
          subtitle: 'Use dark theme across the app',
          type: 'toggle',
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push',
          icon: '🔔',
          title: 'Push Notifications',
          subtitle: 'Receive alerts for orders and dealers',
          type: 'toggle',
          value: pushNotifications,
          onToggle: setPushNotifications,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          id: 'biometric',
          icon: '🔒',
          title: 'Biometric Login',
          subtitle: 'Use fingerprint or face ID',
          type: 'toggle',
          value: biometric,
          onToggle: setBiometric,
        },
        {
          id: 'changePassword',
          icon: '🔑',
          title: 'Change Password',
          subtitle: 'Update your account password',
          type: 'navigate',
          onPress: () => {
            // TODO: Navigate to change password screen
          },
        },
      ],
    },
    {
      title: 'General',
      items: [
        {
          id: 'language',
          icon: '🌐',
          title: 'Language',
          subtitle: 'English',
          type: 'navigate',
          onPress: () => {
            // TODO: Show language picker
          },
        },
        {
          id: 'clearCache',
          icon: '🗑️',
          title: 'Clear Cache',
          subtitle: 'Free up storage space',
          type: 'action',
          onPress: handleClearCache,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'privacy',
          icon: '📄',
          title: 'Privacy Policy',
          type: 'navigate',
          onPress: () => {
            // TODO: Open privacy policy
          },
        },
        {
          id: 'terms',
          icon: '📋',
          title: 'Terms of Service',
          type: 'navigate',
          onPress: () => {
            // TODO: Open terms of service
          },
        },
        {
          id: 'version',
          icon: 'ℹ️',
          title: 'App Version',
          subtitle: '1.0.0 (Build 100)',
          type: 'navigate',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your app preferences</Text>

        {settingsSections.map((section) => (
          <AppCard key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <SettingsRow key={item.id} item={item} />
            ))}
          </AppCard>
        ))}

        {/* ── Danger Zone ─────────────────────────────────────────── */}
        <AppCard style={styles.dangerCard}>
          <TouchableOpacity onPress={() => {}} style={styles.dangerRow}>
            <View style={styles.dangerIconBox}>
              <Text style={styles.dangerIcon}>⚠️</Text>
            </View>
            <View style={styles.dangerContent}>
              <Text style={styles.dangerTitle}>Delete Account</Text>
              <Text style={styles.dangerSubtitle}>
                Permanently delete your account and all data
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </AppCard>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Row Styles ─────────────────────────────────────────────────────────────────
const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  iconText: { fontSize: 16 },
  content: { flex: 1 },
  title: { ...Typography.label, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.gray400, marginLeft: Spacing[2] },
});

// ── Main Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing[4], paddingBottom: Spacing[10] },
  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing[5] },

  // Sections
  sectionCard: { marginBottom: Spacing[4] },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing[2],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Danger Zone
  dangerCard: {
    marginBottom: Spacing[4],
    borderColor: Colors.errorLight,
    borderWidth: 1,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
  },
  dangerIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  dangerIcon: { fontSize: 16 },
  dangerContent: { flex: 1 },
  dangerTitle: { ...Typography.label, color: Colors.error },
  dangerSubtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 20, color: Colors.gray400 },
});

export default SettingsScreen;
