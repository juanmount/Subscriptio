import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/services/authStore';
import { resetPassword } from '@/services/authService';
import { Colors, Spacing } from '@/ui/theme';
import { t } from '@/i18n';

const BG = '#DDD6FE';
const PRIMARY = '#6B52E0';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoading, signInWithGoogle, signInWithEmail } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  async function handleEmailLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('login.fillFields'));
      return;
    }
    try {
      await signInWithEmail(email.trim(), password);
    } catch (e: any) {
      Alert.alert(t('login.errorSignIn'), mensajeError(e.code));
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      Alert.alert(t('login.enterEmail'));
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert(t('login.emailSent'), t('login.emailSentDesc'));
    } catch (e: any) {
      Alert.alert(t('login.errorGoogle'), mensajeError(e.code));
    }
  }

  async function handleGoogle() {
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert(t('login.errorGoogle'), mensajeError(e.code));
    }
  }

  return (
    <ImageBackground
      source={require('../../assets/login-bg.png')}
      style={styles.container}
      resizeMode="cover"
      imageStyle={{ opacity: 0.45 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Image source={require('../../assets/icon.png')} style={styles.logo} />
            <Text style={styles.appName}>STACK</Text>
            <Text style={styles.tagline}>{t('login.tagline')}</Text>
          </View>

          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.headline}>
              {t('login.headline') + '\n'}
              <Text style={styles.headlinePurple}>{t('login.headlinePurple')}</Text>
              <Text style={styles.headlineBlack}>{t('login.headlineBlack')}</Text>
            </Text>
            <Text style={styles.subtext}>
              {t('login.subtext')}
            </Text>
          </View>

          {/* White form card */}
          <View style={styles.card}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('login.email')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#AAA" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputText}
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor="#C0B8E8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t('login.password')}</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#AAA" style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputText, { flex: 1 }]}
                  placeholder="••••••••••••"
                  placeholderTextColor="#C0B8E8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#AAA"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot */}
            <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7} style={styles.forgotRow}>
              <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('login.signIn')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('login.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity
              style={[styles.googleBtn, isLoading && styles.btnDisabled]}
              onPress={handleGoogle}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <GoogleG />
              <Text style={styles.googleBtnText}>{t('login.google')}</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <TouchableOpacity
            style={styles.registerRow}
            onPress={() => router.push('/crear-cuenta')}
            activeOpacity={0.7}
          >
            <Text style={styles.registerText}>
              {t('login.noAccount')}{' '}
              <Text style={styles.registerLink}>{t('login.createAccount')}</Text>
            </Text>
          </TouchableOpacity>

          {/* Security note */}
          <View style={styles.securityRow}>
            <View style={styles.shieldWrap}>
              <Ionicons name="shield-checkmark" size={16} color={PRIMARY} />
            </View>
            <Text style={styles.securityText}>
              {t('login.security')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

function GoogleG() {
  return (
    <View style={gStyles.wrap}>
      <Text style={gStyles.blue}>G</Text>
    </View>
  );
}

const gStyles = StyleSheet.create({
  wrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  blue: { fontSize: 18, fontWeight: '700', color: '#4285F4', lineHeight: 22 },
});

function mensajeError(code: string): string {
  switch (code) {
    case 'auth/user-not-found': return t('login.error.userNotFound');
    case 'auth/wrong-password': return t('login.error.wrongPassword');
    case 'auth/invalid-email': return t('login.error.invalidEmail');
    case 'auth/invalid-credential': return t('login.error.invalidCredential');
    case 'auth/too-many-requests': return t('login.error.tooManyRequests');
    case 'auth/network-request-failed': return t('login.error.network');
    default: return t('login.error.generic');
  }
}

const CARD_SHADOW = {
  shadowColor: 'rgba(107,82,224,0.25)',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 1,
  shadowRadius: 20,
  elevation: 8,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24 },

  /* Logo */
  logoArea: { alignItems: 'center', gap: 4, marginBottom: 20, marginTop: 10 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 4 },
  appName: { fontSize: 30, fontWeight: '900', color: '#1A1040', letterSpacing: -1.5 },
  tagline: { fontSize: 13, color: '#6B52E0', fontWeight: '500', letterSpacing: 0.2 },

  /* Hero */
  hero: { marginBottom: 20 },
  headline: { fontSize: 28, fontWeight: '900', color: '#1A1040', letterSpacing: -1, lineHeight: 36, marginBottom: 10 },
  headlineBlack: { color: '#1A1040' },
  headlinePurple: { color: '#6B52E0' },
  subtext: { fontSize: 14, color: '#5A4E7A', lineHeight: 22, textAlign: 'center' },

  /* White card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    gap: 14,
    ...CARD_SHADOW,
  },

  /* Fields */
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#3D3060' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F1FF',
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: {},
  inputText: { flex: 1, fontSize: 15, color: '#1A1040' },
  eyeBtn: { padding: 4 },

  forgotRow: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 13, fontWeight: '600', color: '#6B52E0' },

  primaryBtn: {
    backgroundColor: '#6B52E0',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B52E0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  btnDisabled: { opacity: 0.6 },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#E2DCFA' },
  dividerText: { fontSize: 13, color: '#9B92C4', fontWeight: '500' },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 54,
    borderWidth: 1,
    borderColor: '#E2DCFA',
  },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#1A1040' },

  registerRow: { alignItems: 'center', marginTop: 20 },
  registerText: { fontSize: 14, color: '#5A4E7A' },
  registerLink: { fontWeight: '800', color: '#6B52E0' },

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 14,
    padding: 12,
  },
  shieldWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(107,82,224,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  securityText: { flex: 1, fontSize: 12, color: '#5A4E7A', lineHeight: 17 },
});
