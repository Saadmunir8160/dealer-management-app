import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';
import { store, persistor } from '@store';
import { ToastProvider, LanguageProvider, ThemeProvider, useTheme } from '@context';
import RootNavigator from './navigation/RootNavigator';

async function checkForOtaUpdate() {
  if (__DEV__ || Platform.OS === 'web') return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch {
    // Offline / no update channel — ignore
  }
}

/** Toast sits below status bar / notch so it never blocks top UI. */
const AppToast = () => {
  const insets = useSafeAreaInsets();
  return <Toast topOffset={Math.max(insets.top, 8) + 8} visibilityTime={3500} />;
};

const ThemedChrome = () => {
  const { isDark, colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
      <AppToast />
    </View>
  );
};

const App = () => {
  useEffect(() => {
    void checkForOtaUpdate();
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const id = 'app-slim-scrollbar';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      *::-webkit-scrollbar { width: 6px; height: 6px; }
      *::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 8px; }
      *::-webkit-scrollbar-thumb { background: #94A3B8; border-radius: 8px; }
      *::-webkit-scrollbar-thumb:hover { background: #64748B; }
      * { scrollbar-width: thin; scrollbar-color: #94A3B8 #F1F5F9; }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <ThemeProvider>
              <LanguageProvider>
                <ToastProvider>
                  <ThemedChrome />
                </ToastProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
