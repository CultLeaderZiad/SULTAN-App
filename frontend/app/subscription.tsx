import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const [yearly, setYearly] = useState(false);

  const plans = useQuery(api.pricingPlans.getPlans);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="sub-back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Upgrade Plan', 'ترقية الخطة')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {t('Unlock premium features', 'افتح المميزات المتقدمة')}
        </Text>

        {/* Billing Toggle */}
        <View style={[styles.billingToggle, { backgroundColor: colors.elevated }]}>
          <TouchableOpacity
            testID="monthly-toggle"
            style={[styles.billingBtn, !yearly && { backgroundColor: colors.primary }]}
            onPress={() => setYearly(false)}
          >
            <Text style={[styles.billingText, { color: !yearly ? '#0A0A0F' : colors.muted }]}>
              {t('Monthly', 'شهري')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="yearly-toggle"
            style={[styles.billingBtn, yearly && { backgroundColor: colors.primary }]}
            onPress={() => setYearly(true)}
          >
            <Text style={[styles.billingText, { color: yearly ? '#0A0A0F' : colors.muted }]}>
              {t('Yearly (-17%)', 'سنوي (-17%)')}
            </Text>
          </TouchableOpacity>
        </View>

        {(plans || []).map((plan) => {
          const price = yearly ? plan.priceYearlyEGP : plan.priceMonthlyEGP;
          const features = language === 'ar' ? plan.featuresAr : plan.features;

          return (
            <View
              key={plan._id}
              testID={`plan-${plan.planId}`}
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.elevated,
                  borderColor: plan.isFeatured ? colors.primary : colors.border,
                  borderWidth: plan.isFeatured ? 2 : 1,
                },
              ]}
            >
              {plan.isFeatured && (
                <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.featuredText}>{t('MOST POPULAR', 'الأكثر شيوعاً')}</Text>
                </View>
              )}
              <Text style={[styles.planName, { color: colors.primary }]}>
                {language === 'ar' ? plan.nameAr : plan.nameEn}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.planPrice, { color: colors.text }]}>
                  EGP {price}
                </Text>
                <Text style={[styles.planPeriod, { color: colors.muted }]}>
                  /{yearly ? t('year', 'سنة') : t('month', 'شهر')}
                </Text>
              </View>
              <View style={styles.featuresList}>
                {features.map((f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                    <Text style={[styles.featureText, { color: colors.text }]}>{f}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                testID={`select-plan-${plan.planId}`}
                style={[
                  styles.selectBtn,
                  { backgroundColor: plan.isFeatured ? colors.primary : 'transparent', borderColor: colors.primary, borderWidth: 1 },
                ]}
              >
                <Text style={[styles.selectText, { color: plan.isFeatured ? '#0A0A0F' : colors.primary }]}>
                  {t('Subscribe', 'اشترك الآن')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={[styles.trialNote, { color: colors.muted }]}>
          {t('7-day free trial on first signup — all Sultan features', 'تجربة مجانية 7 أيام عند التسجيل — كل مميزات سلطان')}
        </Text>

        {/* Payment Methods */}
        <View style={[styles.paymentSection, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
          <Text style={[styles.paymentTitle, { color: colors.text }]}>
            {t('Payment Methods', 'طرق الدفع')}
          </Text>
          <View style={styles.paymentMethods}>
            <View style={[styles.paymentMethod, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 24 }}>💳</Text>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>InstaPay</Text>
            </View>
            <View style={[styles.paymentMethod, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 24 }}>📱</Text>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>Vodafone Cash</Text>
            </View>
            <View style={[styles.paymentMethod, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <Text style={{ fontSize: 24 }}>🏪</Text>
              <Text style={[styles.paymentLabel, { color: colors.text }]}>Fawry</Text>
            </View>
          </View>
          <TouchableOpacity
            testID="contact-developer-btn"
            style={[styles.contactBtn, { borderColor: colors.primary }]}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
            <Text style={[styles.contactBtnText, { color: colors.primary }]}>
              {t('Contact Developer for Payment', 'تواصل مع المطور للدفع')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.devContact, { color: colors.muted }]}>
            Ziad Sabry — github.com/CultLeaderZiad
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  billingToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  billingBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  billingText: { fontSize: 13, fontWeight: '600' },
  planCard: { borderRadius: 16, padding: 20, marginBottom: 16, overflow: 'hidden' },
  featuredBadge: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  featuredText: { color: '#0A0A0F', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  planName: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  planPrice: { fontSize: 32, fontWeight: '900' },
  planPeriod: { fontSize: 14, marginLeft: 4 },
  featuresList: { gap: 8, marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 13 },
  selectBtn: { height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  selectText: { fontSize: 14, fontWeight: '700' },
  trialNote: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  paymentSection: { marginTop: 24, padding: 20, borderRadius: 16, borderWidth: 1 },
  paymentTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  paymentMethods: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  paymentMethod: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', gap: 4 },
  paymentLabel: { fontSize: 11, fontWeight: '600' },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, gap: 8 },
  contactBtnText: { fontSize: 13, fontWeight: '600' },
  devContact: { fontSize: 11, textAlign: 'center', marginTop: 8 },
});
