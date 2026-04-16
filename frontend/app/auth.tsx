import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AuthScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { login, register, loginWithGoogle, setConvexUserId } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [isLogin, setIsLogin] = useState(params.mode !== 'register');
  const [activeTab, setActiveTab] = useState<'email' | 'google'>('email');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const createConvexUser = useMutation(api.users.createUser);

  const handleEmailAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(fullName, email, password);
      }
      router.replace('/onboarding');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const handleGoogleAuth = async () => {
    try {
      const redirectUrl = `${BACKEND_URL}/auth-callback`;
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        const url = result.url;
        const hashPart = url.split('#')[1];
        if (hashPart) {
          const params = new URLSearchParams(hashPart);
          const sessionId = params.get('session_id');
          if (sessionId) {
            setLoading(true);
            await loginWithGoogle(sessionId);
            router.replace('/onboarding');
          }
        }
      }
    } catch (e: any) {
      Alert.alert('Error', 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="auth-back-btn" onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.primary }]}>
            {isLogin ? 'Welcome Back' : 'Join SULTAN'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {isLogin ? 'تسجيل الدخول' : 'انضم لسلطان'}
          </Text>

          {/* Tabs */}
          <View style={[styles.tabs, { borderColor: colors.border }]}>
            <TouchableOpacity
              testID="email-tab"
              style={[styles.tab, activeTab === 'email' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('email')}
            >
              <Ionicons name="mail" size={18} color={activeTab === 'email' ? colors.primary : colors.muted} />
              <Text style={[styles.tabText, { color: activeTab === 'email' ? colors.primary : colors.muted }]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="google-tab"
              style={[styles.tab, activeTab === 'google' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('google')}
            >
              <Ionicons name="logo-google" size={18} color={activeTab === 'google' ? colors.primary : colors.muted} />
              <Text style={[styles.tabText, { color: activeTab === 'google' ? colors.primary : colors.muted }]}>
                Google
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'email' ? (
            <View style={styles.form}>
              {!isLogin && (
                <View style={[styles.inputContainer, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Ionicons name="person" size={20} color={colors.muted} />
                  <TextInput
                    testID="fullname-input"
                    style={[styles.input, { color: colors.text }]}
                    placeholder={t('Full Name', 'الاسم الكامل')}
                    placeholderTextColor={colors.muted}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              )}
              <View style={[styles.inputContainer, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <Ionicons name="mail" size={20} color={colors.muted} />
                <TextInput
                  testID="email-input"
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('Email', 'البريد الإلكتروني')}
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.inputContainer, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <Ionicons name="lock-closed" size={20} color={colors.muted} />
                <TextInput
                  testID="password-input"
                  style={[styles.input, { color: colors.text }]}
                  placeholder={t('Password', 'كلمة المرور')}
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                testID="auth-submit-btn"
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleEmailAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#0A0A0F" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isLogin ? t('Sign In', 'تسجيل الدخول') : t('Create Account', 'إنشاء حساب')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <TouchableOpacity
                testID="google-signin-btn"
                style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.elevated }]}
                onPress={handleGoogleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text style={[styles.googleBtnText, { color: colors.text }]}>
                      {t('Continue with Google', 'المتابعة بحساب جوجل')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            testID="toggle-auth-mode"
            onPress={() => setIsLogin(!isLogin)}
            style={styles.toggleBtn}
          >
            <Text style={[styles.toggleText, { color: colors.muted }]}>
              {isLogin
                ? t("Don't have an account? ", 'ليس لديك حساب؟ ')
                : t('Already have an account? ', 'لديك حساب بالفعل؟ ')}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>
                {isLogin ? t('Sign Up', 'سجل الآن') : t('Sign In', 'سجل دخول')}
              </Text>
            </Text>
          </TouchableOpacity>

          {isLogin && (
            <TouchableOpacity
              testID="forgot-password-link"
              onPress={() => router.push('/forgot-password')}
              style={{ marginTop: 8, paddingBottom: 32 }}
            >
              <Text style={[{ color: colors.primary, fontSize: 14, textAlign: 'center' }]}>
                {t('Forgot Password?', 'نسيت كلمة المرور؟')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { padding: 8, alignSelf: 'flex-start', marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 18, marginBottom: 32 },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    gap: 12,
  },
  input: { flex: 1, fontSize: 16 },
  submitBtn: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700' },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  googleBtnText: { fontSize: 16, fontWeight: '600' },
  toggleBtn: { alignItems: 'center', marginTop: 24, paddingBottom: 32 },
  toggleText: { fontSize: 14 },
});
