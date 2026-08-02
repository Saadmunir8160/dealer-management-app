import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@types';
import { Colors, Typography, Spacing, BorderRadius } from '@theme';

interface Props {
  visible: boolean;
  products: Product[];
  /** Already selected product (highlight only) */
  initialSelectedId?: number;
  onClose: () => void;
  /** Called immediately when a row is tapped */
  onDone: (productId: number) => void;
}

const ProductPickerModal: React.FC<Props> = ({
  visible,
  products,
  initialSelectedId,
  onClose,
  onDone,
}) => {
  const { height, width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    setSelectedId(initialSelectedId && initialSelectedId > 0 ? initialSelectedId : null);
  }, [visible, initialSelectedId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => {
      const hay = `${p.productName} ${p.arabicName ?? ''} ${p.sku ?? ''} ${p.code ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, query]);

  const pick = (productId: number) => {
    setSelectedId(productId);
    onDone(productId);
  };

  const dialogWidth = Math.min(width - 32, 640);
  const listMaxHeight = Math.min(height * 0.55, 460);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.dialog, { width: dialogWidth }]}>
              <View style={styles.header}>
                <Text style={styles.title}>Please Select Item Code</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={22} color={Colors.gray500} />
                </TouchableOpacity>
              </View>

              <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={Colors.gray500} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search by product name, code, or LN code..."
                  placeholderTextColor={Colors.gray500}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.tableHead}>
                <Text style={[styles.th, styles.colName]}>Product Name</Text>
                <Text style={[styles.th, styles.colLn]}>LN Code</Text>
              </View>

              <FlatList
                data={filtered}
                keyExtractor={item => String(item.productId)}
                style={{ maxHeight: listMaxHeight }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.empty}>No products match your search.</Text>
                }
                renderItem={({ item }) => {
                  const on = selectedId === item.productId;
                  const ln = item.code || item.sku || '—';
                  const name = item.arabicName
                    ? `${item.productName} | ${item.arabicName}`
                    : item.productName;
                  return (
                    <TouchableOpacity
                      style={[styles.row, on && styles.rowOn]}
                      onPress={() => pick(item.productId)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.name, styles.colName]} numberOfLines={2}>
                        {name}
                      </Text>
                      <Text style={[styles.ln, styles.colLn]}>{ln}</Text>
                    </TouchableOpacity>
                  );
                }}
              />

              <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    maxHeight: '90%',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
      } as object,
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  title: {
    ...Typography.h5,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[4],
    gap: Spacing[2],
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    paddingVertical: Spacing[3],
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[2],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  th: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  colName: { flex: 1, paddingRight: Spacing[2] },
  colLn: { width: 88, textAlign: 'right' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  rowOn: { backgroundColor: Colors.primaryLight },
  name: { ...Typography.bodySmall, color: Colors.textPrimary },
  ln: { ...Typography.label, color: Colors.gray700, fontWeight: '600' },
  empty: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing[6],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  cancelBtn: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  cancelText: {
    ...Typography.button,
    color: Colors.textPrimary,
    fontSize: 14,
  },
});

export default ProductPickerModal;
