// ─────────────────────────────────────────────────────────────────────────────
// src/utils/formatters.ts
// Pure formatting functions for display values.
// ─────────────────────────────────────────────────────────────────────────────
import { format, parseISO } from 'date-fns';
import { DATE_FORMATS } from '@constants';

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

export const formatDate = (dateString: string, pattern: string = DATE_FORMATS.DISPLAY): string => {
  try {
    return format(parseISO(dateString), pattern);
  } catch {
    return dateString;
  }
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('');
};

export const formatNumber = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
