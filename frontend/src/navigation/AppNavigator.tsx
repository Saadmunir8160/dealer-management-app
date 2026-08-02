import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from '@types';
import { useTheme } from '@context';

import BottomTabNavigator from './BottomTabNavigator';
import OrderDetailScreen from '@screens/Orders/OrderDetailScreen';
import CreateOrderScreen from '@screens/Orders/CreateOrder/CreateOrderScreen';
import VoiceOrderScreen from '@screens/Orders/VoiceOrder/VoiceOrderScreen';
import EditProfileScreen from '@screens/Profile/EditProfileScreen';
import ChangePasswordScreen from '@screens/Profile/ChangePasswordScreen';
import NotificationsScreen from '@screens/Notifications/NotificationsScreen';
import SettingsScreen from '@screens/Settings/SettingsScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: '600', color: colors.textPrimary },
        headerBackTitleVisible: false,
        contentStyle: { backgroundColor: colors.background },
        statusBarTranslucent: false,
      }}
    >
      <Stack.Screen
        name="BottomTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen
        name="CreateOrder"
        component={CreateOrderScreen}
        options={({ route }) => ({
          title: route.params?.mode === 'voice' ? 'Voice Order' : 'New Order',
        })}
      />
      <Stack.Screen
        name="VoiceOrder"
        component={VoiceOrderScreen}
        options={{ title: 'New Order' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Change Password' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
