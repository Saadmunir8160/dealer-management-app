import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@hooks';
import { useToast } from '@context';
import { Colors, Spacing, BorderRadius } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';
import { loginThunk } from '@store/slices/authSlice';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LOGIN_BG = require('../../../../assets/loginPageBackground.jpg');

/** UCIC portal brand blue (matches screenshot) */
const BRAND_BLUE = '#1B3A6B';
const LOGIN_ORANGE = '#F39223';

const loginSchema = yup.object({
  email: yup.string().required('Email or username is required').min(3, 'Enter email or username'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginForm = yup.InferType<typeof loginSchema>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading } = useAuth();
  const { showError } = useToast();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login({ email: data.email.trim(), password: data.password });
      if (loginThunk.rejected.match(result)) {
        const payload = result.payload as { message?: string } | undefined;
        showError('Login Failed', payload?.message ?? 'Invalid credentials');
      }
    } catch (error) {
      const msg = (error as { message?: string })?.message ?? 'Login failed. Please try again.';
      showError('Login Failed', msg);
    }
  };

  return (
    <ImageBackground source={LOGIN_BG} style={styles.background} resizeMode="cover">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandAr}>شركة اسمنت المتحدة الصناعية</Text>
              <Text style={styles.brandEn}>UNITED CEMENT INDUSTRIAL COMPANY</Text>
              <Text style={styles.signInHint}>Sign in to continue to your account</Text>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="default"
                  placeholder="Email or username"
                  error={errors.email?.message}
                  autoComplete="email"
                  textContentType="emailAddress"
                  filled
                  containerStyle={styles.inputGap}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <AppInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Password"
                  isPassword
                  error={errors.password?.message}
                  autoComplete="password"
                  textContentType="password"
                  filled
                  containerStyle={styles.inputGap}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <AppButton
              title="Login"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
              fullWidth
              size="lg"
              style={styles.loginBtn}
              textStyle={styles.loginBtnText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const { width } = Dimensions.get('window');
const cardMaxWidth = Math.min(400, width - 40);

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  card: {
    width: cardMaxWidth,
    maxWidth: '100%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[7],
    paddingBottom: Spacing[6],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 12,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: Spacing[5],
  },
  brandAr: {
    fontSize: 20,
    fontWeight: '600',
    color: BRAND_BLUE,
    textAlign: 'center',
    marginBottom: 6,
    writingDirection: 'rtl',
  },
  brandEn: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: BRAND_BLUE,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  signInHint: {
    fontSize: 13,
    color: '#8A94A6',
    textAlign: 'center',
  },
  inputGap: { marginBottom: Spacing[3] },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: Spacing[3],
    marginTop: -Spacing[1],
  },
  forgotText: {
    fontSize: 13,
    color: BRAND_BLUE,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: LOGIN_ORANGE,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing[2],
    minHeight: 48,
  },
  loginBtnText: {
    fontWeight: '700',
    fontSize: 16,
    color: Colors.white,
  },
});

export default LoginScreen;
