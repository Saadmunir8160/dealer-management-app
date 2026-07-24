// ─────────────────────────────────────────────────────────────────────────────
// src/navigation/RootNavigator.tsx
// Top-level navigator. Switches between AuthNavigator and AppNavigator
// based on the Redux auth state. Handles the Splash screen.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '@types';
import { useAppDispatch, useAppSelector } from '@hooks';
import { hydrateAuthThunk } from '@store/slices/authSlice';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import SplashScreen from '@screens/Splash/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector(state => state.auth);
  const [isHydrated, setIsHydrated] = React.useState(false);

  useEffect(() => {
    dispatch(hydrateAuthThunk()).finally(() => setIsHydrated(true));
  }, [dispatch]);

  if (!isHydrated) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
