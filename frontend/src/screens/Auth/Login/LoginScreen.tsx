import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  useWindowDimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@types';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '@hooks';
import { useToast, useLanguage } from '@context';
import { Colors, Spacing, BorderRadius, Shadows } from '@theme';
import AppInput from '@components/inputs/AppInput';
import AppButton from '@components/buttons/AppButton';
import { loginThunk } from '@store/slices/authSlice';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LOGIN_BG = require('../../../../assets/loginPageBackground.jpg');
const LOGO = require('../../../../assets/ucic-logo.png');

const loginSchema = yup.object({
  email: yup.string().required('Email or username is required').min(3, 'Enter email or username'),
  password: yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
});

type LoginForm = yup.InferType<typeof loginSchema>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading, refreshProfile } = useAuth();
  const { showError } = useToast();
  const { t, isRTL } = useLanguage();
  const { width } = useWindowDimensions();
  const cardMaxWidth = Math.min(420, width - 40);

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
        return;
      }
      try {
        await refreshProfile();
      } catch {
        // Profile enrich must never undo a successful login.
      }
    } catch (error) {
      const msg = (error as { message?: string })?.message ?? 'Login failed. Please try again.';
      showError('Login Failed', msg);
    }
  };

  return (
    <ImageBackground source={LOGIN_BG} style={styles.background} resizeMode="cover">
      <View style={styles.dim} />
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[styles.card, { width: cardMaxWidth }, Shadows.lg as object]}>
              <View style={styles.brandBlock}>
                <Image source={LOGO} style={styles.logo} resizeMode="contain" />
                <Text style={[styles.brandAr, isRTL && styles.rtl]}>شركة الأسمنت المتحدة الصناعية</Text>
                <Text style={styles.brandEn}>UNITED CEMENT INDUSTRIAL COMPANY</Text>
                <Text style={styles.signInHint}>{t('signInContinue')}</Text>
              </View>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label={t('emailAddress')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="default"
                    placeholder=""
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
                    label={t('password')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder=""
                    isPassword
                    error={errors.password?.message}
                    autoComplete="password"
                    textContentType="password"
                    filled
                    containerStyle={styles.inputGap}
                  />
                )}
              />

              <View style={[styles.forgotRow, isRTL && styles.rowReverse]}>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
                </TouchableOpacity>
              </View>

              <AppButton
                title={t('login')}
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                fullWidth
                size="lg"
                style={styles.loginBtn}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[8],
    paddingHorizontal: Spacing[4],
  },
  card: {
    maxWidth: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[6],
    paddingBottom: Spacing[6],
  },
  brandBlock: { alignItems: 'center', marginBottom: Spacing[5] },
  logo: { width: 72, height: 72, marginBottom: Spacing[3] },
  brandAr: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: 6,
  },
  brandEn: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: Colors.primaryDark,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  signInHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputGap: { marginBottom: Spacing[3] },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing[4],
  },
  rowReverse: { flexDirection: 'row-reverse' },
  rtl: { writingDirection: 'rtl' },
  forgotText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  loginBtn: { borderRadius: BorderRadius.lg },
});

export default LoginScreen;
