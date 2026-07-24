import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from '@types';
import { Colors, FontSize } from '@theme';
import { useLanguage } from '@context';

import DashboardScreen from '@screens/Dashboard/DashboardScreen';
import OrdersScreen from '@screens/Orders/OrdersScreen';
import ProfileScreen from '@screens/Profile/ProfileScreen';
import SupportScreen from '@screens/Support/SupportScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TabIcon = ({ label, focused }: { label: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Dashboard: '▦',
    Orders: '☰',
    Profile: '☺',
    Support: '☎',
  };
  return (
    <Text style={{ color: focused ? Colors.primary : Colors.gray500, fontSize: 16 }}>
      {icons[label] ?? '•'}
    </Text>
  );
};

const BottomTabNavigator = () => {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray500,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '600' },
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('dashboard') }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: t('orders') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
      <Tab.Screen name="Support" component={SupportScreen} options={{ title: t('support') }} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
