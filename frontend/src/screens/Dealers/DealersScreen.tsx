// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Dealers/DealersScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Lists all dealers in the system with search, filter, and navigation.
//   This is the primary entry point for dealer management.
//
// BUSINESS LOGIC:
//   1. Fetch paginated dealer list from API
//   2. Support text search (dealerName, contactPerson, city)
//   3. Support status filter (All / Active / Inactive)
//   4. Pull-to-refresh to reload
//   5. Tap a dealer → navigate to DealerDetail
//   6. FAB button → navigate to CreateDealer
//
// FUTURE API INTEGRATION:
//   useDealers() hook already calls DealerService → dealerApi → Backend.
//   When backend is ready, set USE_MOCK=false in config.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, Dealer } from '@types';
import { useDealers } from '@hooks';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import { useLayoutMetrics } from '@theme/layout';
import { SearchBar, StatusChip, Avatar, EmptyState } from '@components/common';
import AppCard from '@components/cards/AppCard';
import SkeletonLoader from '@components/loaders/SkeletonLoader';
import { formatDate } from '@utils';

type NavProp = NativeStackNavigationProp<AppStackParamList>;

type FilterType = 'all' | 'active' | 'inactive';

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const DealersScreen = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const { scrollBottomPad } = useLayoutMetrics();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const statusParam = filter === 'all' ? undefined : filter === 'active';
  const { dealers, isLoading, refetch } = useDealers({
    search: search || undefined,
    status: statusParam,
  });

  const handleFilterChange = useCallback((f: FilterType) => {
    setFilter(f);
  }, []);

  const renderDealer = useCallback(
    ({ item }: { item: Dealer }) => (
      <AppCard
        onPress={() => navigation.navigate('DealerDetail', { dealerId: item.dealerId })}
        style={styles.card}
      >
        <View style={styles.cardRow}>
          <Avatar name={item.dealerName} size={44} />
          <View style={styles.cardContent}>
            <Text style={styles.dealerName}>{item.dealerName}</Text>
            <Text style={styles.dealerMeta}>
              {item.contactPerson ?? 'No contact'} · {item.city ?? 'N/A'}
            </Text>
          </View>
          <StatusChip
            label={item.status ? 'Active' : 'Inactive'}
            type={item.status ? 'success' : 'neutral'}
          />
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.cardFooterText}>{item.email ?? 'No email'}</Text>
          <Text style={styles.cardFooterText}>{formatDate(item.createdDate)}</Text>
        </View>
      </AppCard>
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dealers</Text>
        <Text style={styles.subtitle}>{dealers.length} total dealers</Text>
      </View>

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name, contact, or city..."
        containerStyle={styles.search}
      />

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            onPress={() => handleFilterChange(f.value)}
            style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
          >
            <Text
              style={[styles.filterText, filter === f.value && styles.filterTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && dealers.length === 0 ? (
        <SkeletonLoader count={5} />
      ) : (
        <FlatList
          data={dealers}
          keyExtractor={item => String(item.dealerId)}
          renderItem={renderDealer}
          contentContainerStyle={[styles.list, { paddingBottom: scrollBottomPad + 72 }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="🏢"
              title="No Dealers Found"
              message="Try adjusting your search or filter"
              actionLabel="Add New Dealer"
              onAction={() => navigation.navigate('CreateDealer')}
            />
          }
        />
      )}

      {/* ── FAB: Add Dealer ──────────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, Spacing[4]) + Spacing[2] }]}
        onPress={() => navigation.navigate('CreateDealer')}
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4], paddingBottom: Spacing[2] },
  title: { ...Typography.h3, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  search: { marginHorizontal: Spacing[4], marginBottom: Spacing[2] },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  filterChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.label, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing[4], paddingBottom: 24 },
  card: { marginBottom: Spacing[3] },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardContent: { flex: 1, marginLeft: Spacing[3] },
  dealerName: { ...Typography.label, color: Colors.textPrimary },
  dealerMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[3],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardFooterText: { ...Typography.caption, color: Colors.textDisabled },
  fab: {
    position: 'absolute',
    right: Spacing[4],
    bottom: Spacing[6],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { fontSize: 28, color: Colors.white, lineHeight: 30 },
});

export default DealersScreen;
