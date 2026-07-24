// ─────────────────────────────────────────────────────────────────────────────
// src/services/storageService.ts
// Abstraction layer over AsyncStorage.
// Swap the underlying storage engine here without touching any other file.
// ─────────────────────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageService = {
  setItem: async <T>(key: string, value: T): Promise<void> => {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  },

  getItem: async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },

  clear: async (): Promise<void> => {
    await AsyncStorage.clear();
  },

  multiRemove: async (keys: string[]): Promise<void> => {
    await AsyncStorage.multiRemove(keys);
  },
};
