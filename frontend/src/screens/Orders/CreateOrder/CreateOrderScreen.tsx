// ─────────────────────────────────────────────────────────────────────────────
// src/screens/Orders/CreateOrder/CreateOrderScreen.tsx
//
// WHY THIS SCREEN EXISTS:
//   Allows sales reps to create a new order for a dealer.
//   The user selects a dealer, adds product line items with quantities,
//   and the system calculates totals automatically.
//
// BUSINESS LOGIC:
//   1. Load dealers list → populate dealer dropdown
//   2. Load products list → populate product dropdowns per line item
//   3. User selects dealer
//   4. User adds one or more product line items
//   5. Unit prices auto-populate from product catalog
//   6. Line totals and grand total calculate dynamically
//   7. React Hook Form + Yup validates (dealer + at least 1 item)
//   8. API call to POST /api/orders
//   9. On success: navigate back to orders list
//
// NAVIGATION FLOW:
//   CreateOrder → (success) → OrdersScreen (goBack)
//   CreateOrder → (cancel) → goBack
//   CreateOrder ← Dashboard "New Order" quick action (dealerId optional)
//
// FUTURE API INTEGRATION:
//   OrderService.createOrder() → orderApi.create() → POST /api/orders
//   DealerService.fetchDealers() → GET /api/dealers (for dropdown)
//   ProductService.fetchProducts() → GET /api/products (for dropdown)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList, Dealer, Product, CreateOrderRequest, SelectOption } from '@types';
import { useForm, Controller, useFieldArray, useWatch, Control, UseFormSetValue } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { OrderService } from '@services/orderService';
import { DealerService } from '@services/dealerService';
import { useToast } from '@context';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';
import { MOCK_PRODUCTS } from '@mock/data/products.mock';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';
import AppCard from '@components/cards/AppCard';
import AppLoader from '@components/loaders/AppLoader';
import { Dropdown } from '@components/common';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateOrder'>;

const orderItemSchema = yup.object({
  productId: yup.number().required('Select a product').min(1, 'Select a product'),
  quantity: yup.number().required('Qty required').min(1, 'Min 1').integer('Must be whole number'),
  unitPrice: yup.number().required().min(0),
});

const orderSchema = yup.object({
  dealerId: yup.number().required('Please select a dealer').min(1, 'Please select a dealer'),
  items: yup
    .array()
    .of(orderItemSchema)
    .min(1, 'Add at least one product')
    .required('Add at least one product'),
});

type OrderForm = yup.InferType<typeof orderSchema>;

const calcLineTotal = (quantity: number, unitPrice: number) =>
  (Number(quantity) || 0) * (Number(unitPrice) || 0);

const calcGrandTotal = (
  items: OrderForm['items'] | undefined,
  products: Product[],
) => {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => {
    const qty = Number(item?.quantity) || 0;
    const productId = Number(item?.productId) || 0;
    const product = products.find(p => p.productId === productId);
    const price = Number(product?.price ?? item?.unitPrice ?? 0) || 0;
    return sum + qty * price;
  }, 0);
};

interface LineItemProps {
  index: number;
  control: Control<OrderForm>;
  setValue: UseFormSetValue<OrderForm>;
  errors: any;
  products: Product[];
  productOptions: SelectOption[];
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const LineItem: React.FC<LineItemProps> = ({
  index,
  control,
  setValue,
  errors,
  products,
  productOptions,
  onRemove,
  canRemove,
}) => {
  const itemError = errors?.items?.[index];
  const quantity = useWatch({ control, name: `items.${index}.quantity` }) ?? 0;
  const unitPrice = useWatch({ control, name: `items.${index}.unitPrice` }) ?? 0;
  const productId = useWatch({ control, name: `items.${index}.productId` }) ?? 0;
  const product = products.find(p => p.productId === Number(productId));
  const price = Number(product?.price ?? unitPrice ?? 0) || 0;
  const lineTotal = calcLineTotal(Number(quantity) || 0, price);

  return (
    <View style={lineStyles.container}>
      <View style={lineStyles.header}>
        <Text style={lineStyles.itemNumber}>Item #{index + 1}</Text>
        {canRemove && (
          <TouchableOpacity onPress={() => onRemove(index)} style={lineStyles.removeBtn}>
            <Text style={lineStyles.removeText}>✕ Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <Controller
        control={control}
        name={`items.${index}.productId`}
        render={({ field: { onChange, value } }) => (
          <Dropdown
            label="Product"
            options={productOptions}
            value={value && value > 0 ? value : undefined}
            onChange={(val) => {
              const id = Number(val);
              const selected = products.find(p => p.productId === id);
              onChange(id);
              setValue(`items.${index}.unitPrice`, selected?.price ?? 0, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
            placeholder="Select product..."
            error={itemError?.productId?.message}
          />
        )}
      />

      <View style={lineStyles.row}>
        <View style={lineStyles.halfInput}>
          <Controller
            control={control}
            name={`items.${index}.quantity`}
            render={({ field: { onChange, onBlur, value } }) => (
              <AppInput
                label="Quantity"
                value={String(value ?? '')}
                onChangeText={(text) => onChange(Number(text.replace(/[^0-9]/g, '')) || 0)}
                onBlur={onBlur}
                keyboardType="numeric"
                placeholder="0"
                error={itemError?.quantity?.message}
              />
            )}
          />
        </View>
        <View style={lineStyles.halfInput}>
          <AppInput
            label="Unit Price (Rs)"
            value={String(price)}
            editable={false}
            placeholder="0"
            containerStyle={{ marginBottom: Spacing[4] }}
          />
        </View>
      </View>

      <View style={lineStyles.lineTotalRow}>
        <Text style={lineStyles.lineTotalLabel}>Line Total</Text>
        <Text style={lineStyles.lineTotalValue}>Rs {lineTotal.toLocaleString()}</Text>
      </View>
    </View>
  );
};

const CreateOrderScreen: React.FC<Props> = ({ route, navigation }) => {
  const { dealerId: preSelectedDealerId } = route.params || {};
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);

  const products = useMemo(() => MOCK_PRODUCTS.filter((p) => p.status), []);

  const productOptions: SelectOption[] = useMemo(
    () =>
      products.map((p) => ({
        label: `${p.productName} — Rs ${p.price.toLocaleString()}`,
        value: p.productId,
      })),
    [products],
  );

  const dealerOptions: SelectOption[] = useMemo(
    () =>
      dealers
        .filter((d) => d.status)
        .map((d) => ({
          label: `${d.dealerName} — ${d.city}`,
          value: d.dealerId,
        })),
    [dealers],
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OrderForm>({
    resolver: yupResolver(orderSchema),
    defaultValues: {
      dealerId: preSelectedDealerId || 0,
      items: [{ productId: 0, quantity: 1, unitPrice: 0 }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchedItems = useWatch({ control, name: 'items' });

  useEffect(() => {
    DealerService.fetchDealers({ page: 1, limit: 100 })
      .then((res) => setDealers(res.data))
      .catch(() => showError('Error', 'Failed to load dealers'))
      .finally(() => setIsLoading(false));
  }, [showError]);

  const grandTotal = useMemo(
    () => calcGrandTotal(watchedItems as OrderForm['items'], products),
    [watchedItems, products],
  );

  const totalQuantity = useMemo(() => {
    if (!watchedItems?.length) return 0;
    return watchedItems.reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
  }, [watchedItems]);

  const addItem = () => {
    append({ productId: 0, quantity: 1, unitPrice: 0 });
  };

  const onSubmit = async (data: OrderForm) => {
    setIsSubmitting(true);
    try {
      const payload: CreateOrderRequest = {
        dealerId: data.dealerId,
        items: data.items.map((item) => {
          const product = products.find(p => p.productId === item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product?.price ?? item.unitPrice,
          };
        }),
      };
      await OrderService.createOrder(payload);
      showSuccess('Success', 'Order created successfully');
      navigation.goBack();
    } catch {
      showError('Error', 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <AppLoader message="Loading dealers & products..." />;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create New Order</Text>
          <Text style={styles.subtitle}>Select a dealer and add products</Text>

          <AppCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Dealer</Text>
            <Controller
              control={control}
              name="dealerId"
              render={({ field: { onChange, value } }) => (
                <Dropdown
                  label="Select Dealer"
                  options={dealerOptions}
                  value={value && value > 0 ? value : undefined}
                  onChange={(val) => onChange(Number(val))}
                  placeholder="Choose a dealer..."
                  error={errors.dealerId?.message}
                />
              )}
            />
          </AppCard>

          <AppCard style={styles.sectionCard}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Products</Text>
              <TouchableOpacity onPress={addItem} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ Add Item</Text>
              </TouchableOpacity>
            </View>

            {errors.items && typeof errors.items.message === 'string' && (
              <Text style={styles.formError}>{errors.items.message}</Text>
            )}

            {fields.map((field, index) => (
              <LineItem
                key={field.id}
                index={index}
                control={control}
                setValue={setValue}
                errors={errors}
                products={products}
                productOptions={productOptions}
                onRemove={remove}
                canRemove={fields.length > 1}
              />
            ))}
          </AppCard>

          <AppCard style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Order Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryValue}>{fields.length}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Quantity</Text>
              <Text style={styles.summaryValue}>{totalQuantity}</Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>Rs {grandTotal.toLocaleString()}</Text>
            </View>
          </AppCard>

          <View style={styles.actions}>
            <AppButton
              title="Create Order"
              onPress={handleSubmit(onSubmit)}
              isLoading={isSubmitting}
              fullWidth
              size="lg"
            />
            <AppButton
              title="Cancel"
              onPress={() => navigation.goBack()}
              variant="ghost"
              fullWidth
              style={styles.cancelBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Line Item Styles ───────────────────────────────────────────────────────────
const lineStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[3],
    backgroundColor: Colors.gray100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  itemNumber: { ...Typography.label, color: Colors.primary },
  removeBtn: { padding: Spacing[1] },
  removeText: { ...Typography.bodySmall, color: Colors.error },
  row: { flexDirection: 'row', gap: Spacing[3] },
  halfInput: { flex: 1 },
  lineTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[1],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  lineTotalLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  lineTotalValue: { ...Typography.label, color: Colors.primary },
});

// ── Main Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { padding: Spacing[4], paddingBottom: Spacing[8] },
  title: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing[1] },
  subtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing[4] },
  sectionCard: { marginBottom: Spacing[4] },
  sectionTitle: {
    ...Typography.label,
    color: Colors.textPrimary,
    marginBottom: Spacing[3],
    marginTop: Spacing[1],
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  addBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  addBtnText: { ...Typography.label, color: Colors.primary },
  formError: {
    ...Typography.bodySmall,
    color: Colors.error,
    marginBottom: Spacing[3],
    marginTop: Spacing[1],
  },
  summaryCard: { marginBottom: Spacing[4] },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: { ...Typography.body, color: Colors.textSecondary },
  summaryValue: { ...Typography.body, color: Colors.textPrimary },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: Spacing[3],
    marginTop: Spacing[1],
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  totalLabel: { ...Typography.h5, color: Colors.textPrimary },
  totalValue: { ...Typography.h5, color: Colors.primary },
  actions: {},
  cancelBtn: { marginTop: Spacing[3] },
});

export default CreateOrderScreen;
