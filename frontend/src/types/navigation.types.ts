export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  OTP: { email: string };
};

export type AppStackParamList = {
  BottomTabs: undefined;
  OrderDetail: { orderId: number };
  CreateOrder: { dealerId?: number };
  EditProfile: undefined;
  ChangePassword: undefined;
  Settings: undefined;
  Notifications: undefined;
  // Legacy admin screens (kept for type compatibility)
  DealerDetail: { dealerId: number };
  CreateDealer: undefined;
  EditDealer: { dealerId: number };
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Profile: undefined;
  Support: undefined;
};
