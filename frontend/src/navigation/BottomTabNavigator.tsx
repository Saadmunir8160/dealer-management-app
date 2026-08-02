import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppStackParamList, BottomTabParamList } from '@types';
import { FontSize, Spacing, BorderRadius, Shadows } from '@theme';
import { useLanguage, useTheme } from '@context';

import DashboardScreen from '@screens/Dashboard/DashboardScreen';
import OrdersScreen from '@screens/Orders/OrdersScreen';
import SupportScreen from '@screens/Support/SupportScreen';
import ProfileScreen from '@screens/Profile/ProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type IonName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IonName; inactive: IonName }> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Orders: { active: 'cube', inactive: 'cube-outline' },
  Support: { active: 'headset', inactive: 'headset-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

const NewOrderPlaceholder = () => <View style={{ flex: 1 }} />;

const NewOrderFab = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={styles.fabWrap} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('newOrder')}
        onPress={() => navigation.navigate('CreateOrder', { mode: 'manual' })}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: colors.primary, borderColor: colors.background },
          pressed && { backgroundColor: colors.primaryDark, transform: [{ scale: 0.96 }] },
        ]}
        android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: true, radius: 32 }}
      >
        <Ionicons name="add" size={32} color={colors.white} />
      </Pressable>
      <Text style={[styles.fabLabel, { color: colors.primary }]} numberOfLines={1}>
        {t('newOrder')}
      </Text>
    </View>
  );
};

const BottomTabNavigator = () => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        safeAreaInsets: { top: 0, right: 0, left: 0, bottom: 0 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          position: 'absolute',
          left: Spacing[3],
          right: Spacing[3],
          bottom: Math.max(insets.bottom, 8),
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          borderRadius: BorderRadius.xl,
          backgroundColor: colors.tabBar,
          borderTopWidth: 0,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          ...(Shadows.lg as object),
          elevation: Platform.OS === 'android' ? 14 : 0,
          zIndex: 100,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: t('home') }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: t('orders') }} />
      <Tab.Screen
        name="NewOrder"
        component={NewOrderPlaceholder}
        options={{
          title: t('newOrder'),
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: () => <NewOrderFab />,
        }}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.getParent()?.navigate('CreateOrder', { mode: 'manual' });
          },
        })}
      />
      <Tab.Screen name="Support" component={SupportScreen} options={{ title: t('support') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  fabWrap: {
    top: -22,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    ...(Shadows.fab as object),
  },
  fabLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default BottomTabNavigator;
