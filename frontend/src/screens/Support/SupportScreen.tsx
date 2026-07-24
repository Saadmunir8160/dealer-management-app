import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useToast, useLanguage } from '@context';
import { formatDate } from '@utils';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import { PortalHeader, EmptyState, StatusChip } from '@components/common';
import AppCard from '@components/cards/AppCard';
import AppButton from '@components/buttons/AppButton';
import AppLoader from '@components/loaders/AppLoader';

type TabKey = 'contact' | 'tickets';

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
  const { showSuccess, showError } = useToast();
  const { t, isRTL } = useLanguage();
  const [tab, setTab] = useState<TabKey>('contact');
  const [contact, setContact] = useState<SupportContactInfo | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormValues>({
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <PortalHeader />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, isRTL && styles.rtlText]}>{t('supportCenter')}</Text>
        <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('supportSubtitle')}</Text>

        <View style={[styles.tabs, isRTL && styles.rowReverse]}>
          <TabBtn label={t('contactSupport')} active={tab === 'contact'} onPress={() => setTab('contact')} />
          <TabBtn label={t('myTickets')} active={tab === 'tickets'} onPress={() => setTab('tickets')} />
        </View>

        {tab === 'contact' ? (
          <>
            <AppCard style={styles.formCard}>
              <Text style={[styles.formTitle, isRTL && styles.rtlText]}>{t('createSupportTicket')}</Text>

              <Text style={[styles.label, isRTL && styles.rtlText]}>{t('subject')}</Text>
              <Controller
                control={control}
                name="subject"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.input, isRTL && styles.rtlText]}
                    placeholder={t('enterSubject')}
                    placeholderTextColor={Colors.textDisabled}
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
                    <Text style={[styles.chipText, watch('category') === cat && styles.chipTextActive]}>{cat}</Text>
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
                    <Text style={[styles.chipText, watch('priority') === p && styles.chipTextActive]}>{p}</Text>
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
                    placeholder={t('describeIssue')}
                    placeholderTextColor={Colors.textDisabled}
                    multiline
                    textAlignVertical="top"
                    value={value}
                    onChangeText={onChange}
                  />
                )}
              />
              {!!errors.description && <Text style={styles.error}>{errors.description.message}</Text>}

              <AppButton title={t('submitTicket')} onPress={handleSubmit(onSubmit)} isLoading={submitting} />
            </AppCard>

            <View style={styles.contactList}>
              <ContactCard title={t('phoneSupport')} value={contact?.phone ?? '—'} icon="📞" color={Colors.success} isRTL={isRTL} />
              <ContactCard title={t('emailSupport')} value={contact?.email ?? '—'} icon="✉" color={Colors.primary} hint={t('response24h')} isRTL={isRTL} />
              <ContactCard title={t('whatsapp')} value={contact?.whatsapp ?? '—'} icon="💬" color={Colors.success} isRTL={isRTL} />
            </View>
          </>
        ) : (
          <View style={{ gap: Spacing[3] }}>
            {tickets.length === 0 ? (
              <EmptyState title={t('noTickets')} message={t('noTicketsMsg')} />
            ) : (
              tickets.map(ticket => (
                <AppCard key={ticket.ticketId}>
                  <View style={[styles.ticketTop, isRTL && styles.rowReverse]}>
                    <Text style={[styles.ticketSubject, isRTL && styles.rtlText]}>{ticket.subject}</Text>
                    <StatusChip
                      label={ticket.status}
                      type={ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'success' : 'warning'}
                    />
                  </View>
                  <Text style={[styles.ticketMeta, isRTL && styles.rtlText]}>
                    {ticket.category} · {ticket.priority} · {formatDate(ticket.createdAt)}
                  </Text>
                  <Text style={[styles.ticketDesc, isRTL && styles.rtlText]}>{ticket.description}</Text>
                </AppCard>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const TabBtn = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
    <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const ContactCard = ({
  title,
  value,
  icon,
  color,
  hint,
  isRTL,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
  hint?: string;
  isRTL?: boolean;
}) => (
  <AppCard style={[styles.contactCard, isRTL && styles.rowReverse]}>
    <View style={[styles.contactIcon, { backgroundColor: color + '18' }]}>
      <Text>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.contactTitle, isRTL && styles.rtlText]}>{title}</Text>
      <Text style={[styles.contactValue, isRTL && styles.rtlText]}>{value}</Text>
      {!!hint && <Text style={[styles.contactHint, isRTL && styles.rtlText]}>{hint}</Text>}
    </View>
  </AppCard>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing[4], paddingBottom: Spacing[8] },
  title: { ...Typography.h4, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing[4] },
  tabs: { flexDirection: 'row', marginBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { paddingVertical: Spacing[3], marginRight: Spacing[4] },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { ...Typography.label, color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  formCard: { marginBottom: Spacing[4] },
  formTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing[3] },
  label: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing[1], marginTop: Spacing[2] },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    color: Colors.textPrimary,
  },
  textarea: { minHeight: 110 },
  error: { ...Typography.caption, color: Colors.error, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginBottom: Spacing[1] },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { ...Typography.caption, color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  contactList: { gap: Spacing[3] },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: { ...Typography.label, color: Colors.textPrimary },
  contactValue: { ...Typography.body, color: Colors.textSecondary, marginTop: 2 },
  contactHint: { ...Typography.caption, color: Colors.success, marginTop: 2 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing[2] },
  ticketSubject: { ...Typography.h5, color: Colors.textPrimary, flex: 1 },
  ticketMeta: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing[2] },
  ticketDesc: { ...Typography.body, color: Colors.textPrimary, marginTop: Spacing[2] },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right', writingDirection: 'rtl' },
});

export default SupportScreen;
