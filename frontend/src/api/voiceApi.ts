import apiClient from './axios';
import {
  ApiResponse,
  VoiceProcessRequest,
  VoiceProcessResult,
  VoiceExtractRequest,
  VoiceExtractResult,
} from '@types';

export const voiceApi = {
  process: (payload: VoiceProcessRequest) =>
    apiClient.post<ApiResponse<VoiceProcessResult>>('/voice/process', {
      customerId: payload.customerId,
      text: payload.text,
      orderId: payload.orderId ?? undefined,
      selectedProductName: payload.selectedProductName ?? undefined,
    }),

  extract: (payload: VoiceExtractRequest) =>
    apiClient.post<ApiResponse<VoiceExtractResult>>('/voice/extract', {
      text: payload.text,
      preferredCustomerId: payload.preferredCustomerId ?? undefined,
    }),
};
