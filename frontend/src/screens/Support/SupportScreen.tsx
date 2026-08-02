import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  CreateSupportTicketRequest,
  SupportContactInfo,
  SupportPriority,
  SupportTicket,
} from '@types';
import { SupportService } from '@services/supportService';
import { useToast, useLanguage, useTheme } from '@context';
import { formatDate } from '@utils';
import { Typography, Spacing, BorderRadius, Shadows, useThemedStyles } from '@theme';
import type { AppColors } from '@theme/colors';
import { useLayoutMetrics } from '@theme/layout';
import { EmptyState, StatusChip, PortalHeader } from '@components/common';
import Screen from '@components/layout/Screen';
import AppCard from '@components/cards/AppCard';
import AppLoader from '@components/loaders/AppLoader';

type TabKey = 'contact' | 'tickets';
type IonName = React.ComponentProps<typeof Ionicons>['name'];

const schema = yup.object({
  subject: yup.string().required('Subject is required'),
  category: yup.string().required('Category is required'),
  priority: yup.mixed<SupportPriority>().oneOf(['Low', 'Medium', 'High']).required(),
  description: yup.string().required('Description is required').min(10, 'Min 10 characters'),
});

type FormValues = yup.InferType<typeof schema>;

const CATEGORIES = ['Orders', 'Delivery', 'Billing', 'Account', 'Other'];
const PRIORITIES: SupportPriority[] = ['Low', 'Medium', 'High'];

const SupportScreen = () => {
  const { showSuccess, showError, showInfo } = useToast();
  const { t, isRTL } = useLanguage();
  const { colors } = useTheme();
  const { scrollBottomPad } = useLayoutMetrics();
  const styles = useThemedStyles(createSupportStyles);
  const [tab, setTab] = useState<TabKey>('contact');
  const [contact, setContact] = useState<SupportContactInfo | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: { priority: 'Medium', category: 'Orders' },
  });

  const load = useCallback(async () => {
    try {
      const [c, tix] = await Promise.all([
        SupportService.getContactInfo(),
        SupportService.getTickets(),
      ]);
      setContact(c);
      setTickets(tix);
    } catch {
      showError('Error', 'Failed to load support data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);
      const payload: CreateSupportTicketRequest = {
        subject: values.subject,
        category: values.category,
        priority: values.priority,
        description: values.description,
      };
      const ticket = await SupportService.createTicket(payload);
      setTickets(prev => [ticket, ...prev]);
      reset({ subject: '', category: 'Orders', priority: 'Medium', description: '' });
      showSuccess('Ticket submitted', 'Our team will respond soon.');
      setTab('tickets');
    } catch {
      showError('Error', 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <AppLoader message={t('loadingSupport')} />;

  const phone = contact?.phone ?? '+966 9200 26267';
  const email = contact?.email ?? 'info@unitedcement.com.sa';
  const whatsapp = contact?.whatsapp ?? phone;

  return (
    <Screen edges={['top']}>
      <PortalHeader />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: scrollBottomPad + 88 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, isRTL && styles.rtlText]}>{t('supportCenter')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('supportSubtitle')}</Text>

        <View style={[styles.tabs, isRTL && styles.rowReverse]}>
          <TabBtn
            label={t('contactSupport')}
            active={tab === 'contact'}
            onPress={() => setTab('contact')}
          />
          <TabBtn
            label={t('myTickets')}
            active={tab === 'tickets'}
            onPress={() => setTab('tickets')}
            icon="folder-outline"
          />
        </View>

        {tab === 'contact' ? (
          <>
            <AppCard style={styles.formCard} shadow="md">
              <View style={[styles.cardHead, isRTL && styles.rowReverse]}>
                <View style={styles.cardHeadIcon}>
                  <Ionicons name="chatbubbles" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.formTitle, isRTL && styles.rtlText]}>
                  {t('createSupportTicket')}
                </Text>
              </View>

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('subject')}</Text>
              <Controller
                control={control}
                name="subject"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, isRTL && styles.rtlText]}
                    placeholder="Brief description of your issue."
                    placeholderTextColor={colors.textDisabled}
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {!!errors.subject && <Text style={styles.error}>{errors.subject.message}</Text>}

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('category')}</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, watch('category') === cat && styles.chipActive]}
                    onPress={() => setValue('category', cat)}
                  >
                    <Text
                      style={[styles.chipText, watch('category') === cat && styles.chipTextActive]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('priority')}</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, watch('priority') === p && styles.chipActive]}
                    onPress={() => setValue('priority', p)}
                  >
                    <Text
                      style={[styles.chipText, watch('priority') === p && styles.chipTextActive]}
                    >
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('description')}</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textarea, isRTL && styles.rtlText]}
                    placeholder="Please provide detailed information about your issue..."
                    placeholderTextColor={colors.textDisabled}
                    multiline
                    textAlignVertical="top"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {!!errors.description && (
                <Text style={styles.error}>{errors.description.message}</Text>
              )}

              <TouchableOpacity
                style={[styles.attachBox, isRTL && styles.rowReverse]}
                onPress={() => showInfo(t('comingSoon'), 'File upload will be available soon.')}
                activeOpacity={0.75}
              >
                <Ionicons name="attach" size={20} color={colors.primary} />
                <Text style={styles.attachText}>Upload files (Max 5MB each)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, isRTL && styles.rowReverse]}
                onPress={handleSubmit(onSubmit)}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Ionicons name="send" size={18} color={colors.white} />
                <Text style={styles.submitText}>
                  {submitting ? '…' : t('submitTicket')}
                </Text>
              </TouchableOpacity>
            </AppCard>

            <AppCard style={styles.contactPanel} shadow="md">
              <View style={[styles.cardHead, isRTL && styles.rowReverse]}>
                <View style={styles.cardHeadIcon}>
                  <Ionicons name="person" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.formTitle, isRTL && styles.rtlText]}>
                  Contact Information
                </Text>
              </View>

              <ContactRow
                title={t('phoneSupport')}
                value={phone}
                icon="call"
                color={colors.success}
                isRTL={isRTL}
              />
              <ContactRow
                title="Customer service email"
                value={email}
                icon="mail"
                color={colors.primary}
                hint={t('response24h')}
                isRTL={isRTL}
              />
              <ContactRow
                title={t('whatsapp')}
                value={whatsapp}
                icon="logo-whatsapp"
                color={colors.success}
                isRTL={isRTL}
              />
            </AppCard>
          </>
        ) : (
          <View style={{ gap: Spacing[3] }}>
            {tickets.length === 0 ? (
              <EmptyState title={t('noTickets')} message={t('noTicketsMsg')} />
            ) : (
              tickets.map(ticket => (
                <AppCard key={ticket.ticketId} shadow="sm">
                  <View style={[styles.ticketTop, isRTL && styles.rowReverse]}>
                    <Text style={[styles.ticketSubject, isRTL && styles.rtlText]}>
                      {ticket.subject}
                    </Text>
                    <StatusChip
                      label={ticket.status}
                      type={
                        ticket.status === 'Resolved' || ticket.status === 'Closed'
                          ? 'success'
                          : 'warning'
                      }
                    />
                  </View>
                  <Text style={[styles.ticketMeta, isRTL && styles.rtlText]}>
                    {ticket.category} · {ticket.priority} · {formatDate(ticket.createdAt)}
                  </Text>
                  <Text style={[styles.ticketDesc, isRTL && styles.rtlText]}>
                    {ticket.description}
                  </Text>
                </AppCard>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const TabBtn = ({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: IonName;
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createSupportStyles);
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}
    >
      {icon ? (
        <Ionicons name={icon} size={16} color={active ? colors.primary : colors.textSecondary} />
      ) : null}
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
};

const ContactRow = ({
  title,
  value,
  icon,
  color,
  hint,
  isRTL,
}: {
  title: string;
  value: string;
  icon: IonName;
  color: string;
  hint?: string;
  isRTL?: boolean;
}) => {
  const styles = useThemedStyles(createSupportStyles);
  return (
    <View style={[styles.contactRow, isRTL && styles.rowReverse]}>
      <View style={[styles.contactIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.contactTitle, isRTL && styles.rtlText]}>{title}</Text>
        <Text style={[styles.contactValue, isRTL && styles.rtlText]}>{value}</Text>
        {!!hint && <Text style={[styles.contactHint, isRTL && styles.rtlText]}>{hint}</Text>}
      </View>
    </View>
  );
};

const createSupportStyles = (c: AppColors) => StyleSheet.create({
  container: { padding: Spacing[4] },
  title: { ...Typography.h3, color: c.textPrimary },
  subtitle: {
    ...Typography.bodySmall,
    color: c.textSecondary,
    marginTop: 4,
    marginBottom: Spacing[4],
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  tab: { paddingVertical: Spacing[3], marginRight: Spacing[5] },
  tabActive: { borderBottomWidth: 2, borderBottomColor: c.primary },
  tabText: { ...Typography.label, color: c.textSecondary },
  tabTextActive: { color: c.primary, fontWeight: '700' },
  formCard: { marginBottom: Spacing[4] },
  contactPanel: { marginBottom: Spacing[2], gap: Spacing[3] },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  cardHeadIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: c.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: { ...Typography.h5, color: c.textPrimary, flex: 1 },
  label: {
    ...Typography.label,
    color: c.textSecondary,
    marginBottom: Spacing[1],
    marginTop: Spacing[2],
  },
  input: {
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: c.gray100,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    color: c.textPrimary,
    ...Typography.body,
  },
  textarea: { minHeight: 120 },
  error: { ...Typography.caption, color: c.error, marginTop: 4 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  chip: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: c.surface,
  },
  chipActive: { borderColor: c.primary, backgroundColor: c.primaryLight },
  chipText: { ...Typography.caption, color: c.textSecondary, fontWeight: '600' },
  chipTextActive: { color: c.primary, fontWeight: '700' },
  attachBox: {
    marginTop: Spacing[4],
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: c.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: c.gray100,
  },
  attachText: { ...Typography.bodySmall, color: c.textSecondary, fontWeight: '600' },
  submitBtn: {
    marginTop: Spacing[4],
    backgroundColor: c.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    ...(Shadows.md as object),
  },
  submitText: { ...Typography.button, color: c.white },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: { ...Typography.label, color: c.textPrimary },
  contactValue: { ...Typography.body, color: c.textSecondary, marginTop: 2 },
  contactHint: { ...Typography.caption, color: c.success, marginTop: 2 },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing[2],
  },
  ticketSubject: { ...Typography.h5, color: c.textPrimary, flex: 1 },
  ticketMeta: { ...Typography.caption, color: c.textSecondary, marginTop: Spacing[2] },
  ticketDesc: { ...Typography.body, color: c.textPrimary, marginTop: Spacing[2] },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});

export default SupportScreen;
