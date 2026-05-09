import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (data.email_sent) {
        Alert.alert(
          t('Code Sent', 'تم إرسال الرمز'),
          t('Check your email for the 6-digit code', 'تحقق من بريدك الإلكتروني للرمز المكون من 6 أرقام')
        );
      } else {
        Alert.alert(
          t('Code Sent', 'تم إرسال الرمز'),
          t('If your email is registered, the code is on its way.', 'إذا كان البريد مسجلاً، الرمز في الطريق.')
        );
      }
      setStep('otp');
    } catch (e) {
      Alert.alert(t('Error', 'خطأ'), t('Could not send code. Try again.', 'تعذر إرسال الرمز. حاول مرة أخرى.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', t('Enter 6-digit code', 'أدخل الرمز المكون من 6 أرقام'));
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      if (resp.ok) {
        setStep('reset');
      } else {
        Alert.alert('Error', t('Invalid or expired code', 'رمز غير صحيح أو منتهي الصلاحية'));
      }
    } catch (e) {
      Alert.alert('Error', 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', t('Password must be at least 6 characters', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'));
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (resp.ok) {
        Alert.alert(
          t('Success! 🎉', 'تم بنجاح! 🎉'),
          t('Your password has been reset. Please login.', 'تم تغيير كلمة المرور. سجل دخول الآن.'),
          [{ text: 'OK', onPress: () => router.replace('/auth?mode=login') }]
        );
      } else {
        Alert.alert('Error', 'Reset failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity testID="forgot-back" onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons
              name={step === 'email' ? 'mail' : step === 'otp' ? 'keypad' : 'lock-open'}
              size={40}
              color={colors.primary}
            />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {step === 'email' ? t('Forgot Password?', 'نسيت كلمة المرور؟')
              : step === 'otp' ? t('Enter Code', 'أدخل الرمز')
              : t('New Password', 'كلمة مرور جديدة')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {step === 'email' ? t("Enter your email and we'll send a code", 'أدخل بريدك وهنبعتلك رمز')
              : step === 'otp' ? t('Enter the 6-digit code sent to your email', 'أدخل الرمز المكون من 6 أرقام')
              : t('Choose a strong new password', 'اختار كلمة مرور قوية جديدة')}
          </Text>

          {step === 'email' && (
            <View style={[styles.inputContainer, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              <Ionicons name="mail" size={20} color={colors.muted} />
              <TextInput
                testID="forgot-email-input"
                style={[styles.input, { color: colors.text }]}
                placeholder={t('Email', 'البريد الإلكتروني')}
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          {step === 'otp' && (
            <View style={[styles.inputContainer, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              <Ionicons name="keypad" size={20} color={colors.muted} />
              <TextInput
                testID="otp-input"
                style={[styles.input, { color: colors.text, fontSize: 24, letterSpacing: 8, textAlign: 'center' }]}
                placeholder="• • • • • •"
                placeholderTextColor={colors.muted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          )}

          {step === 'reset' && (
            <View style={[styles.inputContainer, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              <Ionicons name="lock-closed" size={20} color={colors.muted} />
              <TextInput
                testID="new-password-input"
                style={[styles.input, { color: colors.text }]}
                placeholder={t('New Password', 'كلمة المرور الجديدة')}
                placeholderTextColor={colors.muted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
          )}

          <TouchableOpacity
            testID="forgot-submit-btn"
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={step === 'email' ? handleSendOTP : step === 'otp' ? handleVerifyOTP : handleResetPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0F" />
            ) : (
              <Text style={styles.submitBtnText}>
                {step === 'email' ? t('Send Code', 'ارسل الرمز')
                  : step === 'otp' ? t('Verify', 'تحقق')
                  : t('Reset Password', 'تغيير كلمة المرور')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 16 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', paddingTop: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 16, height: 56, gap: 12, width: '100%',
  },
  input: { flex: 1, fontSize: 16 },
  devOtpBox: { marginTop: 12, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', width: '100%' },
  submitBtn: {
    height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    width: '100%', marginTop: 24,
  },
  submitBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700' },
});
