import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { store, persistor } from '@store';
import { ToastProvider, LanguageProvider } from '@context';
import RootNavigator from './navigation/RootNavigator';

const App = () => (
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

export default App;
