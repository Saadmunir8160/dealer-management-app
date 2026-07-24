// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Reports/ReportsScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Provides business intelligence through sales reports, dealer performance
//   rankings, and trend visualization. Management uses this to make decisions.
//
// BUSINESS LOGIC:
//   1. Period selector (7D, 30D, 90D, 1Y) filters all report data
//   2. KPI cards show total sales, orders, avg order value, and growth
//   3. Bar chart visualizes sales trends over time (pure RN Views)
//   4. Dealer performance list ranks dealers by revenue
//   5. Pull-to-refresh reloads all data
//
// NAVIGATION FLOW:
//   Reports (Bottom Tab) → No child navigation
//
// FUTURE API INTEGRATION:
//   ReportService.getSalesReport() → GET /api/reports/sales
//   ReportService.getDealerPerformance() → GET /api/reports/dealer-performance
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportService } from '@services/reportService';
import {
  SalesReport,
  DealerPerformanceItem,
  SalesReportItem,
} from '@types';
import { formatCurrency, formatNumber } from '@utils';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@theme';
import AppCard from '@components/cards/AppCard';
import AppButton from '@components/buttons/AppButton';
import AppLoader from '@components/loaders/AppLoader';
import { EmptyState, ErrorState } from '@components/common';

// ── Constants ──────────────────────────────────────────────────────────────────
const PERIODS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

const getDateRange = (days: number) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    fromDate: from.toISOString().split('T')[0],
    toDate: to.toISOString().split('T')[0],
  };
};

// ── Bar Chart Component (pure RN, no external deps) ────────────────────────────
interface BarChartProps {
  data: SalesReportItem[];
}

const BarChart: React.FC<BarChartProps> = ({ data }: BarChartProps) => {
  if (!data || data.length === 0) return null;

  const maxAmount = Math.max(...data.map((d: SalesReportItem) => d.totalAmount), 1);
  const CHART_HEIGHT = 140;

  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.chartArea}>
        {data.map((item: SalesReportItem, index: number) => {
          const barHeight = Math.max((item.totalAmount / maxAmount) * CHART_HEIGHT, 4);
          const isLast = index === data.length - 1;
          return (
            <View key={item.period + index} style={chartStyles.barWrapper}>
              <Text style={chartStyles.barValue}>
                {item.totalAmount > 0 ? formatNumber(item.totalAmount) : ''}
              </Text>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isLast ? Colors.primary : Colors.primaryLight,
                  },
                ]}
              />
              <Text style={chartStyles.barLabel} numberOfLines={1}>
                {item.period}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// ── KPI Card ───────────────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color: string;
  bgColor: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, color, bgColor }: KpiCardProps) => (
  <View style={[kpiStyles.card, { borderLeftColor: color }]}>
    <View style={[kpiStyles.iconDot, { backgroundColor: bgColor }]}>
      <View style={[kpiStyles.dot, { backgroundColor: color }]} />
    </View>
    <Text style={[kpiStyles.value, { color }]}>{value}</Text>
    <Text style={kpiStyles.title}>{title}</Text>
    {subtitle && <Text style={kpiStyles.subtitle}>{subtitle}</Text>}
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────────
const ReportsScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [performers, setPerformers] = useState<DealerPerformanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const params = { ...getDateRange(selectedPeriod), groupBy: 'day' as const };
    try {
      const [salesRes, perfRes] = await Promise.all([
        ReportService.getSalesReport(params),
        ReportService.getDealerPerformance(params),
      ]);
      setReport(salesRes);
      setPerformers(perfRes.data);
      setError(null);
    } catch {
      setError('Failed to load report data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handlePeriodChange = (days: number) => {
    setSelectedPeriod(days);
  };

  if (isLoading) return <AppLoader message="Loading reports..." />;

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message={error} onRetry={loadData} />
      </SafeAreaView>
    );
  }

  const growth = report ? ((report.totalAmount - 0) / Math.max(1, 1)) * 100 : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Title ─────────────────────────────────────────────────── */}
        <Text style={styles.title}>Reports & Analytics</Text>
        <Text style={styles.subtitle}>Business performance insights</Text>

        {/* ── Period Selector ───────────────────────────────────────── */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.label}
              onPress={() => handlePeriodChange(p.days)}
              style={[
                styles.periodChip,
                selectedPeriod === p.days && styles.periodChipActive,
              ]}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === p.days && styles.periodTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {report && (
          <>
            {/* ── KPI Cards ───────────────────────────────────────── */}
            <View style={styles.kpiGrid}>
              <KpiCard
                title="Total Sales"
                value={`Rs ${formatNumber(report.totalAmount)}`}
                subtitle="All orders"
                color={Colors.primary}
                bgColor={Colors.primaryLight}
              />
              <KpiCard
                title="Total Orders"
                value={String(report.totalOrders)}
                subtitle="Completed + active"
                color={Colors.secondary}
                bgColor={Colors.secondaryLight}
              />
            </View>

            <View style={styles.kpiGrid}>
              <KpiCard
                title="Avg Order Value"
                value={`Rs ${formatNumber(report.averageOrderValue)}`}
                subtitle="Per order"
                color={Colors.success}
                bgColor={Colors.successLight}
              />
              <KpiCard
                title="Active Dealers"
                value={String(performers.length)}
                subtitle="With orders"
                color={Colors.info}
                bgColor={Colors.infoLight}
              />
            </View>

            {/* ── Sales Trend Chart ───────────────────────────────── */}
            <AppCard style={styles.chartCard}>
              <Text style={styles.sectionTitle}>Sales Trend</Text>
              <Text style={styles.sectionSubtitle}>Revenue by period</Text>
              {report.items.length > 0 ? (
                <BarChart data={report.items} />
              ) : (
                <Text style={styles.noData}>No chart data available</Text>
              )}
            </AppCard>

            {/* ── Monthly Breakdown Table ─────────────────────────── */}
            {report.items.length > 0 && (
              <AppCard style={styles.tableCard}>
                <Text style={styles.sectionTitle}>Period Breakdown</Text>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2 }]}>
                    Period
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 1, textAlign: 'right' }]}>
                    Orders
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellHeader, { flex: 2, textAlign: 'right' }]}>
                    Amount
                  </Text>
                </View>

                {/* Table Rows */}
                {report.items.map((item: SalesReportItem, index: number) => (
                  <View
                    key={item.period + index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 && styles.tableRowAlt,
                    ]}
                  >
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.period}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {item.totalOrders}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 2, textAlign: 'right', color: Colors.primary }]}>
                      Rs {item.totalAmount.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </AppCard>
            )}

            {/* ── Dealer Performance ──────────────────────────────── */}
            {performers.length > 0 && (
              <AppCard style={styles.performanceCard}>
                <Text style={styles.sectionTitle}>Dealer Performance</Text>
                <Text style={styles.sectionSubtitle}>Ranked by revenue</Text>

                {performers.map((p: DealerPerformanceItem, index: number) => {
                  const maxRevenue = performers[0]?.totalAmount || 1;
                  const barWidth = (p.totalAmount / maxRevenue) * 100;
                  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                  const medal = index < 3 ? medalColors[index] : null;

                  return (
                    <View key={p.dealerId} style={styles.perfRow}>
                      <View style={styles.perfLeft}>
                        <View
                          style={[
                            styles.rankBadge,
                            medal && { backgroundColor: medal + '20' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.rankText,
                              medal && { color: medal },
                            ]}
                          >
                            #{p.rank}
                          </Text>
                        </View>
                        <View style={styles.perfInfo}>
                          <Text style={styles.perfName}>{p.dealerName}</Text>
                          <Text style={styles.perfMeta}>
                            {p.totalOrders} order{p.totalOrders !== 1 ? 's' : ''} • {p.city}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.perfRevenue}>
                        Rs {formatNumber(p.totalAmount)}
                      </Text>

                      {/* Performance bar */}
                      <View style={styles.perfBarBg}>
                        <View
                          style={[
                            styles.perfBarFill,
                            { width: `${barWidth}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </AppCard>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Chart Styles ───────────────────────────────────────────────────────────────
const chartStyles = StyleSheet.create({
  container: { marginTop: Spacing[3] },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 180,
    paddingTop: Spacing[4],
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 60,
  },
  barValue: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  bar: {
    width: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
  },
  barLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing[2],
    textAlign: 'center',
    fontSize: 9,
  },
});

// ── KPI Styles ─────────────────────────────────────────────────────────────────
const kpiStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    borderLeftWidth: 3,
    ...Shadows.sm,
  },
  iconDot: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  dot: { width: 12, height: 12, borderRadius: BorderRadius.full },
  value: { ...Typography.h5, marginBottom: 2 },
  title: { ...Typography.caption, color: Colors.textSecondary },
  subtitle: { ...Typography.caption, color: Colors.textDisabled, marginTop: 2 },
});

// ── Main Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing[4], paddingBottom: Spacing[10] },
  title: { ...Typography.h3, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing[4] },

  // Period Selector
  periodRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  periodChip: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: { ...Typography.label, color: Colors.textSecondary },
  periodTextActive: { color: Colors.white },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },

  // Chart Card
  chartCard: { marginBottom: Spacing[4] },
  sectionTitle: {
    ...Typography.h5,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing[2],
  },
  noData: {
    ...Typography.body,
    color: Colors.textDisabled,
    textAlign: 'center',
    paddingVertical: Spacing[6],
  },

  // Table
  tableCard: { marginBottom: Spacing[4] },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing[2],
    marginBottom: Spacing[1],
  },
  tableCell: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing[2],
  },
  tableCellHeader: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableRowAlt: { backgroundColor: Colors.gray100, borderRadius: BorderRadius.sm },

  // Dealer Performance
  performanceCard: { marginBottom: Spacing[4] },
  perfRow: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  perfLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2] },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  rankText: { ...Typography.label, color: Colors.textSecondary },
  perfInfo: { flex: 1 },
  perfName: { ...Typography.label, color: Colors.textPrimary },
  perfMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  perfRevenue: {
    ...Typography.h5,
    color: Colors.primary,
    textAlign: 'right',
    marginBottom: Spacing[2],
  },
  perfBarBg: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  perfBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
});

export default ReportsScreen;
