// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Notifications/NotificationsScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Central hub for all system notifications — order status updates,
//   dealer activity alerts, system announcements, and reminders.
//   Users can view, mark as read, and clear notifications.
//
// BUSINESS LOGIC:
//   1. Load notifications from API (mock for now)
//   2. Display grouped by date (Today, Yesterday, Earlier)
//   3. Unread notifications show a blue indicator
//   4. Tap to mark as read
//   5. "Mark All Read" clears all unread indicators
//   6. Pull-to-refresh reloads notifications
//   7. Filter tabs: All, Orders, Dealers, System
//
// NAVIGATION FLOW:
//   Notifications ← Profile screen bell icon / header bell icon
//   Tap notification → navigates to relevant screen (order/dealer detail)
//
// FUTURE API INTEGRATION:
//   GET /api/notifications → list all
//   PUT /api/notifications/:id/read → mark as read
//   PUT /api/notifications/read-all → mark all as read
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@theme';
import { EmptyState } from '@components/common';

type Props = NativeStackScreenProps<AppStackParamList, 'Notifications'>;

// ── Types ──────────────────────────────────────────────────────────────────────
type NotificationType = 'order' | 'dealer' | 'system' | 'alert';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionScreen?: string;
  actionId?: number;
}

type FilterTab = 'all' | 'order' | 'dealer' | 'system';

// ── Mock Data ──────────────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'order',
    title: 'Order #6 Shipped',
    message: 'Your order for Sunrise Building Supplies has been shipped.',
    time: '2024-03-18T14:30:00.000Z',
    isRead: false,
    actionScreen: 'OrderDetail',
    actionId: 6,
  },
  {
    id: 2,
    type: 'order',
    title: 'Order #5 Cancelled',
    message: 'Order for City Cement Depot has been cancelled.',
    time: '2024-03-15T10:00:00.000Z',
    isRead: false,
    actionScreen: 'OrderDetail',
    actionId: 5,
  },
  {
    id: 3,
    type: 'dealer',
    title: 'New Dealer Registered',
    message: 'Sunrise Building Supplies has been added to your network.',
    time: '2024-03-14T09:00:00.000Z',
    isRead: true,
    actionScreen: 'DealerDetail',
    actionId: 7,
  },
  {
    id: 4,
    type: 'system',
    title: 'Monthly Report Ready',
    message: 'Your March 2024 sales report is now available.',
    time: '2024-03-12T08:00:00.000Z',
    isRead: true,
  },
  {
    id: 5,
    type: 'alert',
    title: 'Low Stock Alert',
    message: 'Ceramic Tiles (per sqft) is currently out of stock.',
    time: '2024-03-10T16:00:00.000Z',
    isRead: true,
  },
  {
    id: 6,
    type: 'order',
    title: 'Order #3 Delivered',
    message: 'Order for Al-Noor Builders Supply has been delivered successfully.',
    time: '2024-03-08T11:00:00.000Z',
    isRead: true,
    actionScreen: 'OrderDetail',
    actionId: 3,
  },
  {
    id: 7,
    type: 'dealer',
    title: 'Dealer Status Changed',
    message: 'Rehman Construction Materials has been marked as inactive.',
    time: '2024-03-05T13:00:00.000Z',
    isRead: true,
    actionScreen: 'DealerDetail',
    actionId: 5,
  },
  {
    id: 8,
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on March 1st from 2:00 AM to 4:00 AM.',
    time: '2024-02-28T09:00:00.000Z',
    isRead: true,
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
const getTypeIcon = (type: NotificationType): string => {
  switch (type) {
    case 'order': return '📦';
    case 'dealer': return '🏢';
    case 'system': return '⚙️';
    case 'alert': return '⚠️';
    default: return '🔔';
  }
};

const getTypeBg = (type: NotificationType): string => {
  switch (type) {
    case 'order': return Colors.primaryLight;
    case 'dealer': return Colors.successLight;
    case 'system': return Colors.gray200;
    case 'alert': return Colors.warningLight;
    default: return Colors.gray200;
  }
};

const getTimeLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Orders', value: 'order' },
  { label: 'Dealers', value: 'dealer' },
  { label: 'System', value: 'system' },
];

// ── Notification Item ──────────────────────────────────────────────────────────
interface NotifItemProps {
  item: Notification;
  onPress: (item: Notification) => void;
}

const NotificationItem: React.FC<NotifItemProps> = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(item)}
    style={[notifStyles.container, !item.isRead && notifStyles.unread]}
    activeOpacity={0.7}
  >
    {!item.isRead && <View style={notifStyles.unreadDot} />}

    <View style={[notifStyles.icon, { backgroundColor: getTypeBg(item.type) }]}>
      <Text style={notifStyles.iconText}>{getTypeIcon(item.type)}</Text>
    </View>

    <View style={notifStyles.content}>
      <View style={notifStyles.topRow}>
        <Text style={[notifStyles.title, !item.isRead && notifStyles.titleBold]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={notifStyles.time}>{getTimeLabel(item.time)}</Text>
      </View>
      <Text style={notifStyles.message} numberOfLines={2}>
        {item.message}
      </Text>
    </View>
  </TouchableOpacity>
));

// ── Main Screen ────────────────────────────────────────────────────────────────
const NotificationsScreen: React.FC<Props> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    return notifications.filter((n: Notification) => {
      if (activeFilter === 'system') return n.type === 'system' || n.type === 'alert';
      return n.type === activeFilter;
    });
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n: Notification) => !n.isRead).length,
    [notifications],
  );

  const handlePress = useCallback((item: Notification) => {
    // Mark as read
    setNotifications((prev: Notification[]) =>
      prev.map((n: Notification) => (n.id === item.id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, isRead: true })));
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.subtitle}>{unreadCount} unread</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Filter Tabs ────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            onPress={() => setActiveFilter(tab.value)}
            style={[
              styles.filterChip,
              activeFilter === tab.value && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === tab.value && styles.filterTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Notification List ──────────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={(item: Notification) => String(item.id)}
        renderItem={({ item }: { item: Notification }) => (
          <NotificationItem item={item} onPress={handlePress} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No Notifications"
            message="You're all caught up! Check back later."
            icon="🔔"
          />
        }
      />
    </SafeAreaView>
  );
};

// ── Notification Item Styles ───────────────────────────────────────────────────
const notifStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  unread: {
    backgroundColor: Colors.primaryLight,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    position: 'absolute',
    left: Spacing[2],
    top: Spacing[5],
    zIndex: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  iconText: { fontSize: 18 },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { ...Typography.body, color: Colors.textPrimary, flex: 1, marginRight: Spacing[2] },
  titleBold: { fontFamily: 'Inter-SemiBold' },
  time: { ...Typography.caption, color: Colors.textSecondary },
  message: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 18 },
});

// ── Main Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
  },
  markAllText: { ...Typography.label, color: Colors.primary },

  // Filter Tabs
  filterRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterText: { ...Typography.label, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },

  // List
  listContent: { paddingBottom: Spacing[8] },
});

export default NotificationsScreen;
