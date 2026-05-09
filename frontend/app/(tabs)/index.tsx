import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  registerForPushNotifications,
  checkGoldPriceChange,
  scheduleDailyGoldCheck,
} from '../../src/services/notifications';
import { TrialBanner } from '../../src/components/TrialBanner';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, language } = useLanguage();
  const [refreshing, setRefreshing] = React.useState(false);
  const [liveGoldPrices, setLiveGoldPrices] = useState<any[]>([]);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');
  const goldPrices = useQuery(api.gold.getLatestGoldPrices);
  const inflationData = useQuery(api.inflation.getLatestInflationData);

  const seedGold = useMutation(api.gold.seedGoldPrices);
  const seedInflation = useMutation(api.inflation.seedInflationData);
  const seedPlans = useMutation(api.pricingPlans.seedPricingPlans);
  const seedHalal = useMutation(api.halalGuide.seedHalalGuide);

  const now = new Date();
  const summary = useQuery(
    api.transactions.getMonthlySummary,
    convexUser?._id ? { userId: convexUser._id, month: now.getMonth() + 1, year: now.getFullYear() } : 'skip'
  );
  const recentTxns = useQuery(
    api.transactions.getTransactions,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  // Onboarding redirect: when convex user is loaded but onboarding not complete
  useEffect(() => {
    if (convexUser === null && user?.authId) {
      router.replace('/onboarding');
    } else if (convexUser && convexUser.onboardingCompleted === false) {
      router.replace('/onboarding');
    }
  }, [convexUser, user?.authId]);

  // Seed lookup tables once (idempotent)
  useEffect(() => {
    seedGold({}).catch(() => {});
    seedInflation({}).catch(() => {});
    seedPlans({}).catch(() => {});
    seedHalal({}).catch(() => {});
  }, []);

  // Auto-promote owner email + register push token (native only)
  useEffect(() => {
    if (!convexUser?._id) return;
    ensureSuperAdmin({ userId: convexUser._id as any }).catch(() => {});

    if (Platform.OS !== 'web') {
      (async () => {
        try {
          const token = await registerForPushNotifications();
          if (token && convexUser?._id) {
            await setExpoPushToken({ userId: convexUser._id as any, token });
          }
          await scheduleDailyGoldCheck(language);
        } catch (e) {
          if (__DEV__) console.warn('[dashboard] push setup', e);
        }
      })();
    }
  }, [convexUser?._id]);

  // External APIs
  useEffect(() => {
    fetchLiveGold();
    fetchPrayerTimes();
  }, []);

  const fetchLiveGold = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/gold/prices`);
      const data = await resp.json();
      setLiveGoldPrices(data.prices || []);
      if (data.prices && Platform.OS !== 'web') {
        checkGoldPriceChange(data.prices, language);
      }
    } catch {}
  };

  const fetchPrayerTimes = async () => {
    try {
      const resp = await fetch(`${BACKEND_URL}/api/prayer-times?city=Cairo&country=Egypt`);
      const data = await resp.json();
      setPrayerTimes(data);
    } catch {}
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveGold();
    fetchPrayerTimes();
    setTimeout(() => setRefreshing(false), 800);
  };

  const gold21k = liveGoldPrices.find((g: any) => g.karat === 21) || goldPrices?.find((g) => g.karat === 21);
  const gold21kChange = (liveGoldPrices.find((g: any) => g.karat === 21) as any)?.change24h ?? 0;
  const greeting = language === 'ar'
    ? `أهلاً ${convexUser?.fullName || user?.fullName || ''} 👋`
    : `Hello ${convexUser?.fullName || user?.fullName || ''} 👋`;

  const netWorth = (summary?.totalIncome || 0) - (summary?.totalExpenses || 0);
  const categories = [
    { icon: 'wallet', label: t('Income', 'الدخل'), value: summary?.totalIncome || 0, color: colors.success },
    { icon: 'card', label: t('Expenses', 'المصاريف'), value: summary?.totalExpenses || 0, color: colors.danger },
    { icon: 'trending-up', label: t('Savings', 'المدخرات'), value: `${(summary?.savingsRate || 0).toFixed(0)}%`, color: colors.accent },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text testID="dashboard-greeting" style={[styles.greeting, { color: colors.text }]}>
          {greeting}
        </Text>

        <TrialBanner trialEndsAt={convexUser?.trialEndsAt} plan={convexUser?.plan} />

        <View testID="net-worth-card" style={[styles.netWorthCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.netWorthLabel}>{t('Net Worth', 'صافي الثروة')}</Text>
          <Text style={styles.netWorthValue}>
            {convexUser?.currency || 'EGP'} {netWorth.toLocaleString()}
          </Text>
          <Text style={styles.netWorthChange}>{t('This month', 'هذا الشهر')}</Text>
        </View>

        <View style={styles.statsRow}>
          {categories.map((cat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              <Ionicons name={cat.icon as any} size={20} color={cat.color} />
              <Text style={[styles.statLabel, { color: colors.muted }]}>{cat.label}</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {typeof cat.value === 'number' ? cat.value.toLocaleString() : cat.value}
              </Text>
            </View>
          ))}
        </View>

        {gold21k && (
          <TouchableOpacity
            testID="gold-widget"
            style={[styles.goldWidget, { backgroundColor: colors.elevated, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/invest')}
          >
            <View style={styles.goldHeader}>
              <View style={styles.goldTitleRow}>
                <Text style={{ fontSize: 24 }}>🪙</Text>
                <Text style={[styles.goldTitle, { color: colors.primary }]}>
                  {t('Gold 21K', 'ذهب عيار 21')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.goldPrice, { color: colors.text }]}>
                  EGP {gold21k.pricePerGramEGP.toLocaleString()}
                </Text>
                <Text style={[styles.goldChange, { color: gold21kChange === 0 ? colors.muted : gold21kChange > 0 ? colors.success : colors.danger }]}>
                  {gold21kChange === 0 ? '—' : gold21kChange > 0 ? '▲' : '▼'} {Math.abs(gold21kChange).toFixed(2)}% {t('today', 'اليوم')}
                </Text>
              </View>
            </View>
            <View style={[styles.goldSignal, { backgroundColor: (gold21kChange >= 0 ? colors.success : colors.danger) + '20' }]}>
              <Ionicons name={gold21kChange >= 0 ? 'trending-up' : 'trending-down'} size={16} color={gold21kChange >= 0 ? colors.success : colors.danger} />
              <Text style={[styles.goldSignalText, { color: gold21kChange >= 0 ? colors.success : colors.danger }]}>
                {gold21kChange >= 0
                  ? t('Gold beating inflation', 'الذهب يتغلب على التضخم')
                  : t('Gold dipped today', 'الذهب نزل اليوم')}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {inflationData && inflationData.ratePercent > 15 && (
          <TouchableOpacity
            testID="inflation-alert"
            style={[styles.inflationBanner, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}
            onPress={() => router.push('/inflation')}
          >
            <View style={styles.inflationRow}>
              <Ionicons name="warning" size={24} color={colors.danger} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.inflationTitle, { color: colors.danger }]}>
                  {t('Inflation Alert', 'تحذير التضخم')} ⚠️
                </Text>
                <Text style={[styles.inflationRate, { color: colors.text }]}>
                  {inflationData.ratePercent}% — {t('Your EGP is losing value', 'الجنيه بيفقد قيمته')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('Recent Transactions', 'آخر المعاملات')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>{t('See All', 'عرض الكل')}</Text>
          </TouchableOpacity>
        </View>

        {recentTxns && recentTxns.length > 0 ? (
          recentTxns.slice(0, 5).map((txn, i) => (
            <View
              key={txn._id}
              testID={`recent-txn-${i}`}
              style={[styles.txnRow, { backgroundColor: colors.elevated, borderColor: colors.border }]}
            >
              <View style={[styles.txnIcon, { backgroundColor: txn.type === 'income' ? colors.success + '20' : colors.danger + '20' }]}>
                <Ionicons
                  name={txn.type === 'income' ? 'arrow-down' : 'arrow-up'}
                  size={18}
                  color={txn.type === 'income' ? colors.success : colors.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txnDesc, { color: colors.text }]}>{txn.description}</Text>
                <Text style={[styles.txnDate, { color: colors.muted }]}>
                  {new Date(txn.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.txnAmount, { color: txn.type === 'income' ? colors.success : colors.danger }]}>
                {txn.type === 'income' ? '+' : '-'}{txn.currency} {txn.amount.toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
            <Ionicons name="receipt-outline" size={40} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {t('No transactions yet', 'لا توجد معاملات بعد')}
            </Text>
            <TouchableOpacity
              testID="add-first-txn-btn"
              style={[styles.addFirstBtn, { borderColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/transactions')}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                {t('Add your first transaction', 'أضف أول معاملة')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {prayerTimes?.timings && (
          <View testID="prayer-widget" style={[styles.prayerWidget, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
            <View style={styles.prayerHeader}>
              <Text style={{ fontSize: 18 }}>🕌</Text>
              <Text style={[styles.prayerTitle, { color: colors.primary }]}>
                {t('Prayer Times', 'مواقيت الصلاة')} — {prayerTimes.city}
              </Text>
            </View>
            <View style={styles.prayerRow}>
              {Object.entries(prayerTimes.timings).map(([name, time]) => (
                <View key={name} style={styles.prayerItem}>
                  <Text style={[styles.prayerName, { color: colors.muted }]}>{name}</Text>
                  <Text style={[styles.prayerTime, { color: colors.text }]}>{time as string}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.quickActions}>
          {[
            { icon: 'add-circle', label: t('Add Transaction', 'إضافة معاملة'), route: '/(tabs)/transactions' },
            { icon: 'flag', label: t('Savings Goals', 'أهداف الادخار'), route: '/savings' },
            { icon: 'shield-checkmark', label: t('Inflation Guide', 'دليل التضخم'), route: '/inflation' },
          ].map((action, i) => (
            <TouchableOpacity
              key={i}
              testID={`quick-action-${i}`}
              style={[styles.quickAction, { backgroundColor: colors.elevated, borderColor: colors.border }]}
              onPress={() => router.push(action.route as any)}
            >
              <Ionicons name={action.icon as any} size={24} color={colors.primary} />
              <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.devCredit, { color: colors.faint }]}>
          {t('Developed by Ziad Sabry', 'تطوير زياد صبري')}
        </Text>
      </ScrollView>

      {/* AI Advisor FAB */}
      <TouchableOpacity
        testID="open-advisor-fab"
        accessibilityLabel={t('Ask SULTAN AI', 'اسأل سلطان')}
        style={[styles.aiFab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/advisor')}
        activeOpacity={0.85}
      >
        <Text style={{ fontSize: 26 }}>👑</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 100 },
  greeting: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  netWorthCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
  },
  netWorthLabel: { color: '#0A0A0F', fontSize: 14, fontWeight: '500', opacity: 0.7 },
  netWorthValue: { color: '#0A0A0F', fontSize: 36, fontWeight: '900', marginVertical: 4 },
  netWorthChange: { color: '#0A0A0F', fontSize: 13, opacity: 0.6 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 16, fontWeight: '700' },
  goldWidget: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  goldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goldTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goldTitle: { fontSize: 16, fontWeight: '700' },
  goldPrice: { fontSize: 20, fontWeight: '800' },
  goldChange: { fontSize: 13, marginTop: 2 },
  goldSignal: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, padding: 8, borderRadius: 8 },
  goldSignalText: { fontSize: 12, fontWeight: '600' },
  inflationBanner: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  inflationRow: { flexDirection: 'row', alignItems: 'center' },
  inflationTitle: { fontSize: 14, fontWeight: '700' },
  inflationRate: { fontSize: 13, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  txnIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnDesc: { fontSize: 14, fontWeight: '600' },
  txnDate: { fontSize: 11, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
  emptyState: {
    padding: 32,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 14 },
  addFirstBtn: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  quickAction: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  prayerWidget: { padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 16, marginBottom: 4 },
  prayerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  prayerTitle: { fontSize: 14, fontWeight: '700' },
  prayerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prayerItem: { alignItems: 'center', gap: 2 },
  prayerName: { fontSize: 10, fontWeight: '600' },
  prayerTime: { fontSize: 13, fontWeight: '700' },
  devCredit: { textAlign: 'center', fontSize: 11, marginTop: 24, letterSpacing: 0.5 },
  aiFab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
