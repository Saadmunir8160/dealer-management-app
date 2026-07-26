import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import Toast from 'react-native-toast-message';
import { store, persistor } from '@store';
import { ToastProvider, LanguageProvider } from '@context';
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

const App = () => {
  useEffect(() => {
    void checkForOtaUpdate();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <LanguageProvider>
              <ToastProvider>
                <StatusBar style="dark" />
                <RootNavigator />
                <Toast />
              </ToastProvider>
            </LanguageProvider>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
