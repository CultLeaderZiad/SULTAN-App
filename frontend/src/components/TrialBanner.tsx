import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  trialEndsAt?: number;
  plan?: string;
}

export function TrialBanner({ trialEndsAt, plan }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors } = useTheme();

  if (plan && plan !== 'trial') return null;
  if (!trialEndsAt) return null;

  const msLeft = trialEndsAt - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / 86_400_000));
  const expired = msLeft <= 0;

  return (
    <TouchableOpacity
      testID="trial-banner"
      style={[styles.banner, { backgroundColor: expired ? colors.danger + '15' : colors.primary + '12', borderColor: expired ? colors.danger + '40' : colors.primary + '40' }]}
      activeOpacity={0.85}
      onPress={() => router.push('/subscription')}
    >
      <View style={[styles.iconCircle, { backgroundColor: expired ? colors.danger + '22' : colors.primary + '22' }]}>
        <Ionicons name={expired ? 'alert-circle' : 'diamond'} size={20} color={expired ? colors.danger : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: expired ? colors.danger : colors.primary }]}>
          {expired
            ? t('Your free trial has ended', 'انتهت فترة التجربة المجانية')
            : daysLeft === 1
              ? t('1 day left in your free trial', 'فضل يوم في التجربة المجانية')
              : t(`${daysLeft} days left in your free trial`, `فضل ${daysLeft} أيام في التجربة المجانية`)}
        </Text>
        <Text style={[styles.sub, { color: colors.muted }]}>
          {t('Tap to upgrade and keep all features', 'اضغط للترقية والاحتفاظ بكل المميزات')}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 11, marginTop: 2 },
});
