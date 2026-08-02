import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AppStackParamList,
  Dealer,
  Product,
  CreateOrderRequest,
  SelectOption,
  VoiceProductCandidate,
  VoiceCustomerCandidate,
  VoiceOrderFillResult,
} from '@types';
import { OrderService } from '@services/orderService';
import { DealerService } from '@services/dealerService';
import { ProductService } from '@services/productService';
import { useVoiceOrder } from '@hooks/useVoiceOrder';
import { useToast } from '@context';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';
import AppLoader from '@components/loaders/AppLoader';
import { Dropdown } from '@components/common';
import ProductPickerModal from '@components/modals/ProductPickerModal';
import ConfirmationDialog from '@components/modals/ConfirmationDialog';
import {
  VoiceRecorder,
  TranscriptPanel,
  AIStatus,
} from '@components/voice';
import { getProductUnit } from '@utils/productUnit';
import { normalizeFlexibleDate, isStrictYmdDate } from '@utils/dateParser';
import { parseApiError } from '@utils/errorHandler';
import { bestFuzzyMatch } from '@utils/fuzzyMatch';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateOrder'>;
type InputMode = 'voice' | 'manual';
/** Manual flow: pick item → edit lines → checkout fields → place order */
type OrderStep = 'lines' | 'checkout';

interface LineItem {
  productId: number;
  quantity: number;
  unitPrice: number;
}

/** Bags-per-truck choices for cement bag orders */
const BAGS_PER_TRUCK = [500, 600] as const;
const DEFAULT_BAGS_PER_TRUCK = 600;

const CreateOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const preselectedDealerId = route.params?.dealerId;
  const initialMode: InputMode = route.params?.mode === 'voice' ? 'voice' : 'manual';
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const { showError, showSuccess } = useToast();

  const [mode, setMode] = useState<InputMode>(initialMode);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [dealerId, setDealerId] = useState<number>(preselectedDealerId ?? 0);
  const [couponNumber, setCouponNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  /** Bags-per-truck selection (500 | 600) synced to line items. */
  const [bagsQty, setBagsQty] = useState(String(DEFAULT_BAGS_PER_TRUCK));
  const [driver, setDriver] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [initialPickerShown, setInitialPickerShown] = useState(false);
  const [orderStep, setOrderStep] = useState<OrderStep>('lines');
  const [couponError, setCouponError] = useState(false);
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [confirmLowConfidence, setConfirmLowConfidence] = useState(false);

  const [voiceFilled, setVoiceFilled] = useState(false);
  const [customerCandidates, setCustomerCandidates] = useState<VoiceCustomerCandidate[]>([]);
  const [itemCandidates, setItemCandidates] = useState<
    { lineIndex: number; spoken: string; options: VoiceProductCandidate[] }[]
  >([]);
  const [customerName, setCustomerName] = useState('');

  const deliveryAreas = useMemo(
    () =>
      Array.from(
        new Set(
          dealers
            .flatMap(d => [d.city, d.address].filter((x): x is string => !!x && !!x.trim()))
            .map(s => s.trim()),
        ),
      ),
    [dealers],
  );

  const applyVoiceFill = useCallback(
    (result: VoiceOrderFillResult) => {
      setVoiceFilled(true);
      setCustomerName(result.customerName || '');
      setCustomerCandidates(
        result.customerCandidates.map(c => ({
          dealerId: c.dealerId,
          dealerName: c.dealerName,
          phone: c.phone,
          city: c.city,
        })),
      );
      setItemCandidates(
        result.itemAmbiguities.map(block => ({
          lineIndex: block.lineIndex,
          spoken: block.spoken,
          options: block.options.map(o => ({
            productId: o.productId,
            productName: o.productName,
          })),
        })),
      );

      if (result.dealerId && result.customerConfidence >= 70) {
        setDealerId(result.dealerId);
        const d = dealers.find(x => x.dealerId === result.dealerId);
        if (!result.deliveryArea && d?.address) {
          setDeliveryAddress([d.address, d.city].filter(Boolean).join(', '));
        }
      } else if (result.items.length) {
        // LN + bags (+ coupon) — keep / pick dealer for Place Order
        setDealerId(prev => {
          const id =
            result.dealerId && result.dealerId > 0
              ? result.dealerId
              : prev > 0
                ? prev
                : dealers.find(d => d.status !== false)?.dealerId ?? 0;
          const d = dealers.find(x => x.dealerId === id);
          if (d) {
            setCustomerName(d.dealerName);
          }
          return id;
        });
      } else if (!result.dealerId) {
        setDealerId(prev => (prev > 0 ? prev : dealers.find(d => d.status !== false)?.dealerId ?? 0));
      }

      if (result.items.length) {
        setItems(
          result.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        );
        const firstQty = result.items.find(i => i.quantity > 0)?.quantity;
        if (firstQty === 500 || firstQty === 600) {
          setBagsQty(String(firstQty));
        } else if (firstQty) {
          setBagsQty(
            String(Math.abs(firstQty - 500) <= Math.abs(firstQty - 600) ? 500 : 600),
          );
        }
      }

      if (result.deliveryDate) setDeliveryDate(result.deliveryDate);
      if (result.deliveryArea) setDeliveryAddress(result.deliveryArea);
      if (result.notes) setOrderNotes(result.notes);
      if (result.couponNumber) {
        setCouponNumber(result.couponNumber);
        setCouponError(false);
        setCouponValid(true);
        setCouponDiscount(0);
      }
      if (result.items.length) setOrderStep(result.couponNumber ? 'checkout' : 'lines');
    },
    [dealers],
  );

  const voice = useVoiceOrder({
    enabled: mode === 'voice',
    dealers,
    products,
    areas: deliveryAreas,
    onFill: applyVoiceFill,
    onError: msg => showError('Voice', msg),
    onInfo: (title, message) => showSuccess(title, message),
  });

  const speechLangOptions: SelectOption[] = useMemo(
    () => voice.speechLanguages.map(l => ({ label: l.label, value: l.code })),
    [voice.speechLanguages],
  );

  const itemCount = useMemo(
    () => items.filter(i => i.productId > 0).length,
    [items],
  );

  const totalBags = useMemo(
    () =>
      items.reduce((s, i) => {
        if (!i.productId) return s;
        const product = products.find(p => p.productId === i.productId);
        return getProductUnit(product) === 'BAGS' ? s + (Number(i.quantity) || 0) : s;
      }, 0),
    [items, products],
  );

  const totalTons = useMemo(
    () =>
      items.reduce((s, i) => {
        if (!i.productId) return s;
        const product = products.find(p => p.productId === i.productId);
        return getProductUnit(product) === 'TONS' ? s + (Number(i.quantity) || 0) : s;
      }, 0),
    [items, products],
  );

  const selectedProductId = useMemo(
    () => items.find(i => i.productId > 0)?.productId,
    [items],
  );

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const productList = await ProductService.fetchActiveProducts();
      setProducts(productList);
      setItems(prev =>
        prev.filter(line => productList.some(p => p.productId === line.productId)),
      );
    } catch {
      showError('Error', 'Failed to load products');
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [showError]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      DealerService.fetchDealers({ page: 1, limit: 100 }),
      ProductService.fetchActiveProducts(),
    ])
      .then(([dealerRes, productList]) => {
        if (cancelled) return;
        const list = dealerRes.data ?? [];
        setDealers(list);
        setProducts(productList);
        if (preselectedDealerId) {
          setDealerId(preselectedDealerId);
          const d = list.find(x => x.dealerId === preselectedDealerId);
          if (d?.address) {
            setDeliveryAddress([d.address, d.city].filter(Boolean).join(', '));
          }
        } else {
          const fallback = list.find(d => d.status !== false);
          if (fallback) {
            setDealerId(fallback.dealerId);
            setCustomerName(fallback.dealerName);
          }
        }
      })
      .catch(() => showError('Error', 'Failed to load dealers or products'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preselectedDealerId, showError]);

  // New Order → open item picker first (manual mode)
  useEffect(() => {
    if (loading || loadingProducts || initialPickerShown) return;
    if (mode !== 'manual') return;
    if (products.filter(p => p.status).length === 0) return;
    setPickerOpen(true);
    setInitialPickerShown(true);
  }, [loading, loadingProducts, products, mode, initialPickerShown]);

  const onStartOver = async () => {
    await voice.resetVoice();
    setVoiceFilled(false);
    setCustomerCandidates([]);
    setItemCandidates([]);
    setCouponNumber('');
    setDeliveryDate('');
    setPoNumber('');
    setDriver('');
    setVehicle('');
    setOrderNotes('');
    setItems([]);
    setCouponError(false);
    setCouponValid(null);
    setCouponDiscount(0);
    setDeliveryAddress('');
    setBagsQty(String(DEFAULT_BAGS_PER_TRUCK));
    // Restore default dealer so Place Order still works after Start Over
    if (preselectedDealerId) {
      setDealerId(preselectedDealerId);
      const d = dealers.find(x => x.dealerId === preselectedDealerId);
      setCustomerName(d?.dealerName ?? '');
    } else {
      const fallback = dealers.find(d => d.status !== false);
      if (fallback) {
        setDealerId(fallback.dealerId);
        setCustomerName(fallback.dealerName);
      } else {
        setDealerId(0);
        setCustomerName('');
      }
    }
    void loadProducts();
  };

  const onPickCustomerCandidate = (c: VoiceCustomerCandidate) => {
    setDealerId(c.dealerId);
    setCustomerName(c.dealerName);
    setCustomerCandidates([]);
    const d = dealers.find(x => x.dealerId === c.dealerId);
    if (d?.address) {
      setDeliveryAddress([d.address, d.city].filter(Boolean).join(', '));
    }
  };

  const onPickItemCandidate = (lineIndex: number, productId: number, productName: string) => {
    const product = products.find(p => p.productId === productId);
    setItems(prev => {
      const next = [...prev];
      if (!next[lineIndex]) return prev;
      next[lineIndex] = {
        ...next[lineIndex],
        productId,
        unitPrice: Number(product?.price ?? next[lineIndex].unitPrice),
      };
      return next;
    });
    setItemCandidates(prev => prev.filter(x => x.lineIndex !== lineIndex));
    setVoiceFilled(true);
    void productName;
  };

  const addItem = () => {
    setPickerOpen(true);
  };

  const parseBagsQty = (raw: string): number => {
    const n = parseInt(String(raw || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const onPickerDone = (productId: number) => {
    const defaultQty = parseBagsQty(bagsQty) || DEFAULT_BAGS_PER_TRUCK;
    const product = products.find(p => p.productId === productId);
    setItems([
      {
        productId,
        quantity: defaultQty,
        unitPrice: Number(product?.price ?? 0),
      },
    ]);
    if (!parseBagsQty(bagsQty)) setBagsQty(String(defaultQty));
    setPickerOpen(false);
    setOrderStep('lines');
    setVoiceFilled(false);
  };

  const onPickerClose = () => {
    setPickerOpen(false);
    if (items.filter(i => i.productId > 0).length === 0 && mode === 'manual') {
      navigation.goBack();
    }
  };

  const clearItems = () => {
    setItems([]);
    setVoiceFilled(false);
    setOrderStep('lines');
    if (mode === 'manual') setPickerOpen(true);
  };

  const removeItem = (index: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0 && mode === 'manual') {
        setOrderStep('lines');
        setPickerOpen(true);
      }
      return next;
    });
    setVoiceFilled(false);
  };

  const setLineBagsPerTruck = (index: number, qty: number) => {
    setBagsQty(String(qty));
    setItems(prev =>
      prev.map((row, i) => (i === index ? { ...row, quantity: qty } : { ...row, quantity: qty })),
    );
    setVoiceFilled(false);
  };

  /** Any non-empty coupon is accepted — no server / format validation. */
  const acceptCoupon = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCouponValid(null);
      setCouponDiscount(0);
      setCouponError(false);
      return false;
    }
    setCouponValid(true);
    setCouponDiscount(0);
    setCouponError(false);
    return true;
  };

  const submitOrder = async () => {
    const coupon = couponNumber.trim();
    setCouponError(false);

    if (!coupon) {
      showError('Validation', 'Coupon number is required.');
      return;
    }
    acceptCoupon(coupon);

    // Manual flow: bags + coupon is enough — resolve dealer silently
    // (preselected, already chosen, fuzzy name, or first active dealer)
    const matchedCustomer =
      dealerId > 0
        ? dealers.find(d => d.dealerId === dealerId)
        : customerName.trim()
          ? bestFuzzyMatch(customerName.trim(), dealers, d => d.dealerName, 0.55)?.item
          : undefined;

    let resolvedDealerId = matchedCustomer?.dealerId ?? (dealerId > 0 ? dealerId : 0);
    if (!resolvedDealerId) {
      const fallback = dealers.find(d => d.status !== false) ?? dealers[0];
      if (fallback) {
        resolvedDealerId = fallback.dealerId;
        setDealerId(fallback.dealerId);
        setCustomerName(fallback.dealerName);
      }
    }
    if (!resolvedDealerId) {
      showError(
        'Validation',
        'No dealer available. Add a dealer in the system, then place the order.',
      );
      return;
    }
    if (matchedCustomer) {
      setDealerId(matchedCustomer.dealerId);
      setCustomerName(matchedCustomer.dealerName);
    }

    if (deliveryDate.trim() && !isStrictYmdDate(deliveryDate.trim())) {
      showError(
        'Validation',
        'Invalid delivery date. Use format 2026-07-26',
      );
      return;
    }

    const bags = parseBagsQty(bagsQty);
    if (!(BAGS_PER_TRUCK as readonly number[]).includes(bags)) {
      showError('Validation', 'Select bags per truck: 500 or 600.');
      return;
    }

    // Ensure every line uses the top-level bags qty when set
    const withBags = items.map(i => ({
      ...i,
      quantity: bags,
    }));
    setItems(withBags);

    const validItems = withBags.filter(i => i.productId > 0 && i.quantity > 0);
    if (!validItems.length) {
      showError('Validation', 'Add at least one product.');
      return;
    }
    if (itemCandidates.length > 0) {
      showError('Review required', 'Resolve ambiguous product matches before confirming.');
      return;
    }
    if (customerCandidates.length > 1) {
      showError('Review required', 'Confirm the correct customer before saving.');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateOrderRequest = {
        dealerId: resolvedDealerId,
        couponNumber: coupon || undefined,
        deliveryArea: deliveryAddress.trim() || undefined,
        deliveryDate: deliveryDate.trim()
          ? normalizeFlexibleDate(deliveryDate) || undefined
          : undefined,
        erpOrderNumber: poNumber.trim() || undefined,
        driver: driver.trim() || undefined,
        vehicle: vehicle.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        items: validItems.map(i => {
          const product = products.find(p => p.productId === i.productId);
          return {
            productId: i.productId,
            quantity: Number(i.quantity),
            unitPrice: Number(product?.price ?? i.unitPrice ?? 0),
          };
        }),
      };
      await OrderService.createOrder(payload);
      showSuccess('Order confirmed', 'Order created successfully');
      navigation.goBack();
    } catch (e: unknown) {
      const err = parseApiError(e);
      showError(
        'Error',
        err.message ||
          'Failed to save order. Check connection and try again.',
      );
    } finally {
      setSaving(false);
      setConfirmLowConfidence(false);
    }
  };

  const onReviewSave = async () => {
    // LN + bags + coupon orders: place directly (no AI confidence gate)
    const ready =
      itemCount > 0 &&
      !!couponNumber.trim() &&
      (BAGS_PER_TRUCK as readonly number[]).includes(parseBagsQty(bagsQty));
    if (
      mode === 'voice' &&
      !ready &&
      (voice.needsConfirmation ||
        (voice.confidence != null && voice.confidence.overall < 90))
    ) {
      setConfirmLowConfidence(true);
      return;
    }
    await submitOrder();
  };

  if (loading) return <AppLoader message="Loading..." />;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Order Details</Text>
          <Text style={styles.subtitle}>
            {orderStep === 'lines' && mode === 'manual'
              ? 'Review order lines, set bags per truck, then proceed to checkout.'
              : 'Enter customer, coupon, and delivery details, then place your order.'}
          </Text>

          {/* Input method — hide on manual lines step for UCIC-style Order Details */}
          {(mode === 'voice' || orderStep === 'checkout') && (
          <View style={styles.methodCard}>
            <View style={styles.methodCopy}>
              <Text style={styles.methodTitle}>Choose Input Method</Text>
              <Text style={styles.methodHint}>Select how you want to create this order.</Text>
            </View>
            <View style={styles.segment}>
              <TouchableOpacity
                style={[styles.segmentBtn, mode === 'voice' && styles.segmentBtnActive]}
                onPress={() => setMode('voice')}
              >
                <Text style={[styles.segmentText, mode === 'voice' && styles.segmentTextActive]}>
                  Create with Voice
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, mode === 'manual' && styles.segmentBtnActive]}
                onPress={() => {
                  setMode('manual');
                  if (itemCount === 0) setPickerOpen(true);
                }}
              >
                <Text style={[styles.segmentText, mode === 'manual' && styles.segmentTextActive]}>
                  Create Manually
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          )}

          <View style={[styles.bodyRow, wide && styles.bodyRowWide]}>
            {/* Voice panel */}
            {mode === 'voice' && (
              <View style={[styles.panel, wide && styles.voicePanelWide]}>
                <View style={styles.panelHead}>
                  <Text style={styles.panelTitle}>Voice Assistant</Text>
                </View>

                <AIStatus
                  phase={voice.phase}
                  progress={voice.progress}
                  message={voice.statusMessage}
                />

                <Dropdown
                  label="Speech language"
                  options={speechLangOptions}
                  value={voice.language}
                  onChange={val => voice.setLanguage(String(val))}
                  placeholder="Select language"
                  containerStyle={styles.langDropdown}
                />

                <VoiceRecorder
                  isListening={voice.isLiveListening}
                  processing={voice.processing}
                  disabled={!voice.isSupported}
                  listenSeconds={voice.listenSeconds}
                  pulse={voice.pulse}
                  onPressIn={voice.onMicHoldStart}
                  onPressOut={voice.onMicHoldEnd}
                  hint={
                    voice.isLiveListening && voice.partialTranscript
                      ? `Live: ${voice.partialTranscript}`
                      : undefined
                  }
                />

                <TranscriptPanel
                  liveText={
                    voice.isLiveListening && voice.partialTranscript
                      ? voice.partialTranscript
                      : voice.liveTranscript || voice.typedCommand || ' - '
                  }
                  typedCommand={voice.typedCommand}
                  onChangeTyped={voice.setTypedCommand}
                  onExtract={voice.onRunTypedCommand}
                  extracting={voice.processing}
                  extractLabel="Fill order"
                />

                {customerCandidates.length > 1 && (
                  <View style={styles.candidateWrap}>
                    <Text style={styles.candidateTitle}>Multiple customers — choose one</Text>
                    <View style={styles.chipRow}>
                      {customerCandidates.map(c => (
                        <TouchableOpacity
                          key={c.dealerId}
                          style={styles.chip}
                          onPress={() => onPickCustomerCandidate(c)}
                        >
                          <Text style={styles.chipText}>
                            {c.dealerName}
                            {c.city ? ` (${c.city})` : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {itemCandidates.map(block => (
                  <View key={`item-cand-${block.lineIndex}`} style={styles.candidateWrap}>
                    <Text style={styles.candidateTitle}>
                      Multiple products for &quot;{block.spoken}&quot;
                    </Text>
                    <View style={styles.chipRow}>
                      {block.options.map(c => (
                        <TouchableOpacity
                          key={c.productId}
                          style={styles.chip}
                          onPress={() =>
                            onPickItemCandidate(block.lineIndex, c.productId, c.productName)
                          }
                        >
                          <Text style={styles.chipText}>{c.productName}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}

                <View style={styles.voiceActions}>
                  <TouchableOpacity
                    style={[
                      styles.outlineBtn,
                      styles.stopBtn,
                      !voice.isLiveListening && styles.outlineBtnDisabled,
                    ]}
                    onPress={voice.onStopRecording}
                    disabled={!voice.isLiveListening}
                    accessibilityLabel="Stop recording"
                  >
                    <Text style={styles.stopBtnText} numberOfLines={1}>
                      Stop
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.outlineBtn,
                      styles.resetBtn,
                      voice.processing && styles.outlineBtnDisabled,
                    ]}
                    onPress={voice.onRetryExtract}
                    disabled={voice.processing}
                    accessibilityLabel="Retry"
                  >
                    <Text style={styles.resetBtnText} numberOfLines={1}>
                      Retry
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.outlineBtn, styles.resetBtn]}
                    onPress={onStartOver}
                    accessibilityLabel="Start over"
                  >
                    <Text style={styles.resetBtnText} numberOfLines={1}>
                      Start Over
                    </Text>
                  </TouchableOpacity>
                </View>

                {!voice.isSupported && (
                  <Text style={styles.warn}>
                    {Platform.OS === 'web'
                      ? 'Use Chrome and allow the microphone.'
                      : 'Voice needs Chrome web or a native build.'}
                  </Text>
                )}
              </View>
            )}

            {/* Order details */}
            <View style={[styles.panel, styles.detailsPanel, wide && mode === 'voice' && styles.detailsWide]}>
              <View style={styles.panelHead}>
                <Text style={styles.panelTitle}>
                  {orderStep === 'lines' && mode === 'manual' ? 'Order Lines' : 'Order Details'}
                </Text>
                {voiceFilled && (
                  <View style={styles.autoBadge}>
                    <Text style={styles.autoBadgeText}>Auto-filled from voice</Text>
                  </View>
                )}
              </View>

              {/* UCIC-style Order Lines — Bags per Truck 500 | 600 */}
              <View style={styles.linesCard}>
                <View style={styles.linesHead}>
                  <Text style={styles.linesTitle}>Order Lines ({itemCount})</Text>
                  {itemCount > 0 ? (
                    <TouchableOpacity style={styles.clearBtn} onPress={clearItems}>
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                      <Text style={styles.clearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {itemCount === 0 ? (
                  <View style={styles.linesEmpty}>
                    <AppButton title="Select Item Code" onPress={addItem} />
                  </View>
                ) : (
                  <>
                    <View style={styles.lineTableHead}>
                      <Text style={[styles.lineTh, styles.lineHeadProduct]}>Product</Text>
                      <Text style={[styles.lineTh, styles.lineHeadQty]}>Quantity</Text>
                      <Text style={[styles.lineTh, styles.lineHeadTotal]}>Total</Text>
                      <Text style={[styles.lineTh, styles.lineHeadAction]}>Actions</Text>
                    </View>
                    {items.map((item, index) => {
                      const product = products.find(p => p.productId === item.productId);
                      const unit = getProductUnit(product);
                      const qty = Number(item.quantity) || 0;
                      const code = product?.code || product?.sku || '';
                      const label = product
                        ? `${code ? `${code} - ` : ''}${product.productName}${
                            product.arabicName ? ` | ${product.arabicName}` : ''
                          }`
                        : ' - ';
                      const unitLabel = unit === 'BAGS' ? 'BAG' : unit;
                      return (
                        <View key={`line-${item.productId}-${index}`} style={styles.lineRow}>
                          <View style={styles.lineColProduct}>
                            <Text style={styles.lineProductName} numberOfLines={3}>
                              {label}
                            </Text>
                          </View>
                          <View style={styles.lineColQty}>
                            <Text style={styles.bagsPerTruckLabel}>Bags per Truck:</Text>
                            <View style={styles.bagsToggleRow}>
                              {BAGS_PER_TRUCK.map(n => {
                                const active = qty === n;
                                return (
                                  <TouchableOpacity
                                    key={`bpt-${index}-${n}`}
                                    style={[
                                      styles.bagsToggle,
                                      active && styles.bagsToggleActive,
                                    ]}
                                    onPress={() => setLineBagsPerTruck(index, n)}
                                  >
                                    <Text
                                      style={[
                                        styles.bagsToggleText,
                                        active && styles.bagsToggleTextActive,
                                      ]}
                                    >
                                      {n}
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>
                          <Text style={styles.lineTotalCell}>
                            {qty} {unitLabel}
                          </Text>
                          <TouchableOpacity
                            style={styles.lineDelete}
                            onPress={() => removeItem(index)}
                            accessibilityLabel="Delete item"
                          >
                            <Ionicons name="trash-outline" size={18} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    <TouchableOpacity style={styles.addProductsBtn} onPress={addItem}>
                      <Text style={styles.addProductsText}>+ Change product</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>

              {(orderStep === 'checkout' || mode === 'voice' || itemCount > 0) && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Order Information</Text>
                <AppInput
                  label="Coupon *"
                  value={couponNumber}
                  onChangeText={text => {
                    setCouponNumber(text);
                    setCouponDiscount(0);
                    setValidatingCoupon(false);
                    if (text.trim()) {
                      setCouponValid(true);
                      setCouponError(false);
                    } else {
                      setCouponValid(null);
                      setCouponError(false);
                    }
                  }}
                  filled
                />
              </View>
              )}

              {/* Order Summary — live totals */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Items</Text>
                  <Text style={styles.summaryValue}>{itemCount}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Bags</Text>
                  <Text style={styles.summaryValue}>{totalBags}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total Tons</Text>
                  <Text style={styles.summaryValue}>{totalTons.toFixed(2)}</Text>
                </View>

                <View style={styles.summaryActions}>
                  <AppButton
                    title="Back"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                  />
                  <AppButton
                    title={saving ? 'Placing...' : 'Place Order'}
                    onPress={onReviewSave}
                    isLoading={saving}
                    style={styles.placeBtn}
                    disabled={
                      saving ||
                      itemCount === 0 ||
                      !parseBagsQty(bagsQty) ||
                      !couponNumber.trim()
                    }
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <ProductPickerModal
          visible={pickerOpen}
          products={products.filter(p => p.status)}
          initialSelectedId={selectedProductId}
          onClose={onPickerClose}
          onDone={onPickerDone}
        />

        <ConfirmationDialog
          visible={confirmLowConfidence}
          title="Confirm order?"
          message="Review product, bags, and coupon, then confirm to place the order."
          confirmLabel="Place Order"
          cancelLabel="Review again"
          isLoading={saving}
          onConfirm={() => {
            void submitOrder();
          }}
          onCancel={() => setConfirmLowConfidence(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing[4], paddingBottom: Spacing[10] },
  title: { ...Typography.h4, color: Colors.textPrimary },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    marginBottom: Spacing[4],
  },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    marginBottom: Spacing[4],
    gap: Spacing[3],
  },
  methodCopy: { gap: 2 },
  methodTitle: { ...Typography.h5, color: Colors.textPrimary },
  methodHint: { ...Typography.caption, color: Colors.textSecondary },
  segment: { flexDirection: 'row', gap: Spacing[2], flexWrap: 'wrap' },
  segmentBtn: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
  },
  segmentBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  segmentText: { ...Typography.button, color: Colors.textSecondary },
  segmentTextActive: { color: Colors.white },
  bodyRow: { gap: Spacing[4], marginBottom: Spacing[4] },
  bodyRowWide: { flexDirection: 'row', alignItems: 'flex-start' },
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[4],
    flex: 1,
  },
  voicePanelWide: { flex: 0.9, maxWidth: 420 },
  detailsPanel: { flex: 1.4 },
  detailsWide: { flex: 1.6 },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  panelTitle: { ...Typography.h5, color: Colors.textPrimary },
  listeningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  listeningBadgeText: { ...Typography.caption, color: Colors.secondaryDark, fontWeight: '700' },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray400,
  },
  liveDotOn: { backgroundColor: Colors.success },
  micRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginVertical: Spacing[3],
  },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 48 },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  micBtn: { alignItems: 'center', justifyContent: 'center' },
  micListening: { opacity: 1 },
  micBusy: { opacity: 0.7 },
  micRingOuter: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 2,
    borderColor: Colors.primary + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRingInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: 36 },
  timerText: {
    ...Typography.h4,
    color: Colors.primary,
    textAlign: 'center',
  },
  listenHint: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  transcriptBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    gap: Spacing[1],
  },
  transcriptText: {
    ...Typography.body,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  fieldFull: {
    width: '100%',
    flexBasis: '100%',
  },
  candidateTitle: {
    ...Typography.label,
    color: Colors.primaryDark,
    marginBottom: Spacing[1],
  },
  candidateWrap: { marginBottom: Spacing[3] },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  chipText: { ...Typography.caption, color: Colors.primary, fontWeight: '600' },
  voiceActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing[2],
    marginBottom: Spacing[3],
  },
  outlineBtn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  outlineBtnDisabled: {
    opacity: 0.45,
  },
  stopBtn: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  stopBtnText: {
    ...Typography.label,
    color: Colors.error,
    fontWeight: '700',
    textAlign: 'center',
  },
  resetBtn: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  resetBtnText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  warn: { ...Typography.caption, color: Colors.warning, marginTop: Spacing[2] },
  autoBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  autoBadgeText: { ...Typography.caption, color: Colors.secondaryDark, fontWeight: '700' },
  formGrid: { gap: Spacing[3], marginBottom: Spacing[4] },
  formGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  field: { flexGrow: 1, flexBasis: '45%', minWidth: 200 },
  bagsQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  bagsChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  bagsChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  bagsChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  bagsChipTextActive: {
    color: Colors.primaryDark,
  },
  bagsPerTruckLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  bagsToggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  bagsToggle: {
    minWidth: 52,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagsToggleActive: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  bagsToggleText: {
    ...Typography.label,
    color: Colors.primary,
    fontWeight: '700',
  },
  bagsToggleTextActive: {
    color: Colors.white,
  },
  link: { ...Typography.label, color: Colors.primary, marginTop: Spacing[1] },
  itemsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  itemsTitle: { ...Typography.h5, color: Colors.textPrimary },
  addItemBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  addItemText: { ...Typography.button, color: Colors.white, fontSize: 13 },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing[2],
    marginBottom: Spacing[1],
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  th: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '700' },
  td: { ...Typography.bodySmall, color: Colors.textPrimary },
  colNum: { width: 28 },
  colProduct: { flex: 1.8, minWidth: 120 },
  colQty: { width: 72 },
  colUnit: { width: 40, textAlign: 'center' },
  colPrice: { width: 88, textAlign: 'right' },
  colTotal: { width: 96, textAlign: 'right' },
  colAction: { width: 40, alignItems: 'center' },
  totalCell: { fontWeight: '700', color: Colors.textPrimary },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 16,
    color: Colors.error,
  },
  langDropdown: { marginBottom: Spacing[2] },
  typeLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  runTypedBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    marginTop: 2,
    justifyContent: 'center',
    maxWidth: 140,
    minWidth: 88,
  },
  runTypedBtnDisabled: { opacity: 0.5 },
  runTypedText: { ...Typography.button, color: Colors.white, fontSize: 13, textAlign: 'center' },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  totalItems: { ...Typography.body, color: Colors.success },
  totalItemsStrong: { fontWeight: '800' },
  totalAmount: { ...Typography.h5, color: Colors.success },
  totalAmountLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[3],
    flexWrap: 'wrap',
  },
  footerCancel: { minWidth: 120 },
  footerSave: { minWidth: 200 },

  linesCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    backgroundColor: Colors.white,
  },
  linesHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  linesTitle: { ...Typography.h5, color: Colors.textPrimary },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    backgroundColor: Colors.white,
  },
  clearBtnText: { ...Typography.caption, color: Colors.error, fontWeight: '700' },
  linesEmpty: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  linesEmptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  lineTableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing[2],
    gap: Spacing[1],
  },
  lineTh: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lineHeadProduct: { flex: 1.4 },
  lineHeadQty: { width: 140 },
  lineHeadTotal: { width: 72, textAlign: 'right' },
  lineHeadAction: { width: 44, textAlign: 'center' },
  lineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    gap: Spacing[2],
  },
  lineTotalCell: {
    width: 72,
    textAlign: 'right',
    alignSelf: 'center',
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  lineColProduct: { flexGrow: 1, flexBasis: '100%', minWidth: 0 },
  lineColQty: { flexGrow: 1, minWidth: 140 },
  lineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
    flexBasis: '100%',
    marginTop: Spacing[1],
  },
  lineColUnit: {
    minWidth: 72,
    textAlign: 'right',
    alignSelf: 'center',
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  lineColAction: { width: 44, textAlign: 'center' },
  lineProductName: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  lineUnitText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  lineDelete: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProductsBtn: {
    marginTop: Spacing[3],
    alignSelf: 'flex-start',
    paddingVertical: Spacing[2],
  },
  addProductsText: { ...Typography.label, color: Colors.primary, fontWeight: '700' },
  infoCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    gap: Spacing[2],
    backgroundColor: Colors.white,
  },
  infoTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing[1] },
  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    gap: Spacing[2],
    backgroundColor: Colors.surface,
  },
  summaryTitle: { ...Typography.h5, color: Colors.textPrimary, marginBottom: Spacing[2] },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: { ...Typography.body, color: Colors.textSecondary },
  summaryValue: { ...Typography.label, color: Colors.textPrimary, fontWeight: '700' },
  couponAlert: {
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  couponAlertText: { ...Typography.bodySmall, color: Colors.error, fontWeight: '600' },
  couponHint: { ...Typography.bodySmall, color: Colors.gray600, marginTop: Spacing[1] },
  summaryActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[3],
  },
  placeBtn: { flex: 1.4 },
  proceedBtn: { flex: 1.6, backgroundColor: Colors.secondary },
  backBtn: { flex: 1 },
});

export default CreateOrderScreen;
