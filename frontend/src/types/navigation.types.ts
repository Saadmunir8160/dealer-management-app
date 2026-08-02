export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  OTP: { email: string };
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  NewOrder: undefined;
  Support: undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  BottomTabs: undefined | { screen?: keyof BottomTabParamList };
  OrderDetail: { orderId: number };
  CreateOrder: { dealerId?: number; mode?: 'voice' | 'manual' };
  VoiceOrder: { dealerId?: number };
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
  Notifications: undefined;
  // Legacy admin screens (kept for type compatibility)
  DealerDetail: { dealerId: number };
  CreateDealer: undefined;
  EditDealer: { dealerId: number };
};
