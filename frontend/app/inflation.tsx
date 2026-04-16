import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

const SIDE_HUSTLES = [
  { icon: '💻', en: 'Freelancing on Upwork/Khamsat', ar: 'عمل حر على خمسات/Upwork', income: '5,000-20,000', hours: '10-20', difficulty: 'Medium' },
  { icon: '📦', en: 'Dropshipping in EGP', ar: 'دروبشيبينج بالجنيه', income: '3,000-15,000', hours: '5-15', difficulty: 'Hard' },
  { icon: '🎬', en: 'Content Creation', ar: 'صناعة المحتوى', income: '2,000-50,000', hours: '10-30', difficulty: 'Medium' },
  { icon: '📖', en: 'Online Tutoring', ar: 'دروس خصوصية أونلاين', income: '3,000-10,000', hours: '8-15', difficulty: 'Easy' },
  { icon: '🚗', en: 'Careem/Uber Driving', ar: 'سواقة كريم/أوبر', income: '5,000-12,000', hours: '20-40', difficulty: 'Easy' },
  { icon: '🍕', en: 'Food Delivery (Talabat)', ar: 'توصيل أكل (طلبات)', income: '3,000-8,000', hours: '15-30', difficulty: 'Easy' },
  { icon: '📱', en: 'Social Media Management', ar: 'إدارة سوشيال ميديا', income: '4,000-15,000', hours: '10-20', difficulty: 'Medium' },
  { icon: '🌍', en: 'Translation AR/EN', ar: 'ترجمة عربي/إنجليزي', income: '3,000-12,000', hours: '8-15', difficulty: 'Medium' },
  { icon: '🛒', en: 'Facebook Marketplace', ar: 'بيع على فيسبوك', income: '2,000-10,000', hours: '5-10', difficulty: 'Easy' },
  { icon: '🎧', en: 'Remote Customer Service', ar: 'خدمة عملاء عن بُعد', income: '4,000-8,000', hours: '20-40', difficulty: 'Easy' },
];

export default function InflationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'alert' | 'survival' | 'hustles'>('alert');
  const inflationData = useQuery(api.inflation.getLatestInflationData);
  const inflationHistory = useQuery(api.inflation.getInflationHistory, { months: 12 });

  const rate = inflationData?.ratePercent || 15.6;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="inflation-back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Inflation Survival', 'دليل البقاء من التضخم')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Rate Banner */}
      <View style={[styles.rateBanner, { backgroundColor: colors.danger + '15' }]}>
        <Text style={[styles.rateLabel, { color: colors.danger }]}>{t('EGP Inflation Rate', 'معدل التضخم')}</Text>
        <Text style={[styles.rateValue, { color: colors.danger }]}>{rate}%</Text>
        <Text style={[styles.rateSource, { color: colors.muted }]}>{t('Source: Central Bank of Egypt', 'المصدر: البنك المركزي المصري')}</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        {(['alert', 'survival', 'hustles'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            testID={`inflation-tab-${tab}`}
            style={[styles.subTab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.subTabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab === 'alert' ? t('Alert', 'تنبيه') : tab === 'survival' ? t('Survival', 'البقاء') : t('Side Hustles', 'دخل إضافي')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'alert' && (
          <>
            {/* Inflation History */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Monthly Inflation', 'التضخم الشهري')}</Text>
            <View style={styles.historyContainer}>
              {(inflationHistory || []).map((d, i) => (
                <View key={i} style={[styles.historyItem, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Text style={[styles.historyMonth, { color: colors.muted }]}>{d.month.slice(0, 3)}</Text>
                  <View style={[styles.historyBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.historyFill, { height: `${(d.ratePercent / 30) * 100}%`, backgroundColor: d.ratePercent > 20 ? colors.danger : colors.primary }]} />
                  </View>
                  <Text style={[styles.historyRate, { color: d.ratePercent > 20 ? colors.danger : colors.text }]}>{d.ratePercent}%</Text>
                </View>
              ))}
            </View>

            {/* Buying Power */}
            <View style={[styles.buyingPowerCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              <Text style={[styles.bpTitle, { color: colors.danger }]}>
                {t('Your money is losing value', 'فلوسك بتفقد قيمتها')} 📉
              </Text>
              <View style={styles.bpRow}>
                <Text style={[styles.bpLabel, { color: colors.muted }]}>{t('EGP 1,000 one year ago', '1,000 جنيه السنة اللي فاتت')}</Text>
                <Text style={[styles.bpValue, { color: colors.text }]}>= EGP {(1000 * (1 - rate / 100)).toFixed(0)} {t('today', 'النهاردة')}</Text>
              </View>
              <Text style={[styles.bpWarning, { color: colors.danger }]}>
                {t(`You lost EGP ${(1000 * rate / 100).toFixed(0)} in purchasing power`, `خسرت ${(1000 * rate / 100).toFixed(0)} جنيه من القوة الشرائية`)}
              </Text>
            </View>
          </>
        )}

        {activeTab === 'survival' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.success }]}>
              {t('Buy NOW Before Prices Rise', 'اشتري دلوقتي قبل ما الأسعار تزيد')} ✅
            </Text>
            {[
              { icon: '🪙', en: 'Gold — Best hedge against EGP inflation', ar: 'الذهب — أفضل حماية من تضخم الجنيه', score: 9 },
              { icon: '💵', en: 'USD — Preserve value when EGP weakens', ar: 'الدولار — احفظ قيمة فلوسك لما الجنيه بيضعف', score: 8 },
              { icon: '🏠', en: 'Property — Long-term value store', ar: 'العقارات — مخزن قيمة على المدى الطويل', score: 7 },
              { icon: '🥫', en: 'Non-perishable goods — Stock up now', ar: 'سلع غير قابلة للتلف — خزن دلوقتي', score: 6 },
            ].map((item, i) => (
              <View key={i} style={[styles.tipCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <Text style={{ fontSize: 28 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tipText, { color: colors.text }]}>{language === 'ar' ? item.ar : item.en}</Text>
                  <View style={[styles.scoreBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.scoreFill, { width: `${item.score * 10}%`, backgroundColor: colors.success }]} />
                  </View>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { color: colors.danger, marginTop: 24 }]}>
              {t('AVOID Right Now', 'تجنب دلوقتي')} ❌
            </Text>
            {[
              { icon: '💸', en: 'Keeping cash — Loses 15%+ value yearly', ar: 'الاحتفاظ بالكاش — بيفقد 15%+ سنوياً' },
              { icon: '🏦', en: 'Low-rate bank products (below inflation)', ar: 'منتجات بنكية بفائدة أقل من التضخم' },
            ].map((item, i) => (
              <View key={i} style={[styles.tipCard, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]}>
                <Text style={{ fontSize: 28 }}>{item.icon}</Text>
                <Text style={[styles.tipText, { color: colors.text, flex: 1 }]}>{language === 'ar' ? item.ar : item.en}</Text>
              </View>
            ))}

            {/* Survival Tips */}
            {inflationData?.survivalTips && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.primary, marginTop: 24 }]}>
                  {t('Expert Tips', 'نصائح خبراء')} 💡
                </Text>
                {(language === 'ar' ? inflationData.survivalTipsAr : inflationData.survivalTips).map((tip, i) => (
                  <View key={i} style={[styles.tipItem, { borderColor: colors.border }]}>
                    <Text style={[styles.tipNum, { color: colors.primary }]}>{i + 1}</Text>
                    <Text style={[styles.tipItemText, { color: colors.text }]}>{tip}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'hustles' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('Top Side Hustles for Egyptian Men 2025', 'أفضل 10 شغل إضافي للشباب المصري 2025')}
            </Text>
            {SIDE_HUSTLES.map((hustle, i) => (
              <View key={i} testID={`hustle-${i}`} style={[styles.hustleCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <Text style={{ fontSize: 32 }}>{hustle.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hustleName, { color: colors.text }]}>{language === 'ar' ? hustle.ar : hustle.en}</Text>
                  <View style={styles.hustleMeta}>
                    <Text style={[styles.hustleMetaText, { color: colors.success }]}>💰 {hustle.income} EGP/mo</Text>
                    <Text style={[styles.hustleMetaText, { color: colors.muted }]}>⏰ {hustle.hours}h/wk</Text>
                    <Text style={[styles.hustleMetaText, { color: colors.accent }]}>📊 {hustle.difficulty}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  rateBanner: { alignItems: 'center', padding: 20, marginHorizontal: 16, borderRadius: 14, marginBottom: 8 },
  rateLabel: { fontSize: 12, fontWeight: '600' },
  rateValue: { fontSize: 48, fontWeight: '900' },
  rateSource: { fontSize: 11, marginTop: 4 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  subTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subTabText: { fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  historyContainer: { flexDirection: 'row', gap: 6, marginBottom: 16, height: 120 },
  historyItem: { flex: 1, alignItems: 'center', padding: 4, borderRadius: 8, borderWidth: 1 },
  historyMonth: { fontSize: 8, marginBottom: 4 },
  historyBar: { flex: 1, width: '80%', borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  historyFill: { width: '100%', borderRadius: 4 },
  historyRate: { fontSize: 8, fontWeight: '700', marginTop: 2 },
  buyingPowerCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 16 },
  bpTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  bpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  bpLabel: { fontSize: 12 },
  bpValue: { fontSize: 14, fontWeight: '700' },
  bpWarning: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  tipCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  tipText: { fontSize: 13, fontWeight: '500' },
  scoreBar: { height: 4, borderRadius: 2, marginTop: 6 },
  scoreFill: { height: '100%', borderRadius: 2 },
  tipItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  tipNum: { fontSize: 18, fontWeight: '800', width: 24 },
  tipItemText: { fontSize: 13, flex: 1 },
  hustleCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  hustleName: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  hustleMeta: { flexDirection: 'row', gap: 8 },
  hustleMetaText: { fontSize: 10, fontWeight: '500' },
});
