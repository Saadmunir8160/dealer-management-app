// ─────────────────────────────────────────────────────────────────────────────
// src/navigation/AuthNavigator.tsx
// Stack navigator for unauthenticated screens.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@types';

import LoginScreen from '@screens/Auth/Login/LoginScreen';
import ForgotPasswordScreen from '@screens/Auth/ForgotPassword/ForgotPasswordScreen';
import OTPScreen from '@screens/Auth/OTP/OTPScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="OTP" component={OTPScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
