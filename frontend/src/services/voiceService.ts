import Config from '@config';
import { voiceApi } from '@api/voiceApi';
import {
  VoiceProcessRequest,
  VoiceProcessResult,
  VoiceExtractRequest,
  VoiceExtractResult,
  VoiceExtractedOrder,
  VoiceMatchedCustomer,
  VoiceMatchedItem,
} from '@types';
import { parseApiError } from '@utils/errorHandler';

const mapProcessResult = (raw: any): VoiceProcessResult => {
  const d = raw ?? {};
  return {
    success: d.success ?? d.Success ?? false,
    orderId: d.orderId ?? d.OrderId ?? null,
    intent: d.intent ?? d.Intent ?? 'unknown',
    product: d.product ?? d.Product ?? null,
    quantity: d.quantity ?? d.Quantity ?? null,
    message: d.message ?? d.Message ?? '',
    customerName: d.customerName ?? d.CustomerName ?? null,
    orderStatus: d.orderStatus ?? d.OrderStatus ?? null,
    items: (d.items ?? d.Items ?? []).map((i: any) => ({
      productId: i.productId ?? i.ProductId ?? 0,
      productName: i.productName ?? i.ProductName ?? '—',
      quantity: Number(i.quantity ?? i.Quantity ?? 0),
      unitPrice: Number(i.unitPrice ?? i.UnitPrice ?? 0),
      lineTotal: Number(i.lineTotal ?? i.LineTotal ?? 0),
    })),
    candidates: (d.candidates ?? d.Candidates ?? null)?.map((c: any) => ({
      productId: c.productId ?? c.ProductId ?? 0,
      productName: c.productName ?? c.ProductName ?? '—',
      productCode: c.productCode ?? c.ProductCode ?? null,
      sku: c.sku ?? c.Sku ?? null,
    })) ?? null,
  };
};

const mapExtracted = (raw: any): VoiceExtractedOrder => {
  const d = raw ?? {};
  return {
    customer: d.customer ?? d.Customer ?? null,
    phone: d.phone ?? d.Phone ?? null,
    items: (d.items ?? d.Items ?? []).map((i: any) => ({
      product: i.product ?? i.Product ?? '',
      quantity: Number(i.quantity ?? i.Quantity ?? 1),
      unit: i.unit ?? i.Unit ?? null,
    })),
    deliveryDate: d.deliveryDate ?? d.DeliveryDate ?? null,
    address: d.address ?? d.Address ?? null,
    notes: d.notes ?? d.Notes ?? null,
  };
};

const mapCustomer = (raw: any): VoiceMatchedCustomer => {
  const d = raw ?? {};
  return {
    dealerId: d.dealerId ?? d.DealerId ?? null,
    dealerName: d.dealerName ?? d.DealerName ?? null,
    phone: d.phone ?? d.Phone ?? null,
    address: d.address ?? d.Address ?? null,
    city: d.city ?? d.City ?? null,
    matchConfidence: Number(d.matchConfidence ?? d.MatchConfidence ?? 0),
    matched: Boolean(d.matched ?? d.Matched ?? (d.dealerId ?? d.DealerId)),
    candidates: (d.candidates ?? d.Candidates ?? []).map((c: any) => ({
      dealerId: c.dealerId ?? c.DealerId ?? 0,
      dealerName: c.dealerName ?? c.DealerName ?? '—',
      phone: c.phone ?? c.Phone ?? null,
      city: c.city ?? c.City ?? null,
    })),
  };
};

const mapMatchedItems = (raw: any): VoiceMatchedItem[] =>
  (raw ?? []).map((i: any) => ({
    spokenProduct: i.spokenProduct ?? i.SpokenProduct ?? '',
    quantity: Number(i.quantity ?? i.Quantity ?? 1),
    unit: i.unit ?? i.Unit ?? null,
    productId: i.productId ?? i.ProductId ?? null,
    productName: i.productName ?? i.ProductName ?? null,
    unitPrice: i.unitPrice != null || i.UnitPrice != null
      ? Number(i.unitPrice ?? i.UnitPrice)
      : null,
    unitOfMeasure: i.unitOfMeasure ?? i.UnitOfMeasure ?? null,
    matchConfidence: Number(i.matchConfidence ?? i.MatchConfidence ?? 0),
    matched: Boolean(i.matched ?? i.Matched ?? (i.productId ?? i.ProductId)),
    candidates: (i.candidates ?? i.Candidates ?? []).map((c: any) => ({
      productId: c.productId ?? c.ProductId ?? 0,
      productName: c.productName ?? c.ProductName ?? '—',
      productCode: c.productCode ?? c.ProductCode ?? null,
      sku: c.sku ?? c.Sku ?? null,
    })),
  }));

const mapExtractResult = (raw: any): VoiceExtractResult => {
  const d = raw ?? {};
  return {
    success: d.success ?? d.Success ?? false,
    message: d.message ?? d.Message ?? '',
    confidence: Number(d.confidence ?? d.Confidence ?? 0),
    needsReview: Boolean(d.needsReview ?? d.NeedsReview ?? true),
    extractionEngine: d.extractionEngine ?? d.ExtractionEngine ?? 'local',
    transcript: d.transcript ?? d.Transcript ?? '',
    extracted: mapExtracted(d.extracted ?? d.Extracted),
    customer: mapCustomer(d.customer ?? d.Customer),
    matchedItems: mapMatchedItems(d.matchedItems ?? d.MatchedItems),
    resolvedDeliveryDate: d.resolvedDeliveryDate ?? d.ResolvedDeliveryDate ?? null,
    warnings: d.warnings ?? d.Warnings ?? [],
  };
};

export const VoiceService = {
  process: async (payload: VoiceProcessRequest): Promise<VoiceProcessResult> => {
    try {
      if (Config.USE_MOCK) {
        throw new Error('Voice commands require a live API. Disable USE_MOCK.');
      }
      const response = await voiceApi.process(payload);
      const envelope = response.data;
      const mapped = mapProcessResult(envelope?.data);
      if (!mapped.message && envelope?.message) mapped.message = envelope.message;
      if (envelope?.success === true) mapped.success = true;
      if (envelope?.success === false) mapped.success = false;
      return mapped;
    } catch (error: any) {
      const envelope = error?.response?.data;
      const apiData = envelope?.data;
      if (apiData || envelope?.message) {
        const mapped = mapProcessResult(apiData ?? {});
        mapped.success = false;
        if (!mapped.message) {
          mapped.message =
            envelope?.message ?? parseApiError(error).message ?? 'Voice command failed';
        }
        return mapped;
      }
      throw parseApiError(error);
    }
  },

  /** Structured AI extract → autofill New Order (does not create the order). */
  extract: async (payload: VoiceExtractRequest): Promise<VoiceExtractResult> => {
    try {
      if (Config.USE_MOCK) {
        throw new Error('Voice extraction requires a live API. Disable USE_MOCK.');
      }
      const response = await voiceApi.extract(payload);
      const envelope = response.data;
      const mapped = mapExtractResult(envelope?.data);
      if (!mapped.message && envelope?.message) mapped.message = envelope.message;
      if (envelope?.success === true) mapped.success = true;
      if (envelope?.success === false) mapped.success = false;
      return mapped;
    } catch (error: any) {
      const envelope = error?.response?.data;
      const apiData = envelope?.data;
      if (apiData || envelope?.message) {
        const mapped = mapExtractResult(apiData ?? {});
        mapped.success = false;
        if (!mapped.message) {
          mapped.message =
            envelope?.message ?? parseApiError(error).message ?? 'Voice extraction failed';
        }
        return mapped;
      }
      throw parseApiError(error);
    }
  },
};
