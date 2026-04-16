import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'content' | 'pricing'>('overview');

  const stats = useQuery(api.admin.getUserStats);
  const allUsers = useQuery(api.admin.getAllUsers);
  const plans = useQuery(api.pricingPlans.getPlans);
  const halalGuide = useQuery(api.halalGuide.getAll);

  const updatePlan = useMutation(api.admin.updateUserPlan);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="admin-back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>
          {t('Admin Dashboard', 'لوحة الإدارة')} 👑
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        {(['overview', 'users', 'content', 'pricing'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            testID={`admin-tab-${tab}`}
            style={[styles.subTab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.subTabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab === 'overview' ? t('Overview', 'نظرة عامة')
                : tab === 'users' ? t('Users', 'المستخدمين')
                : tab === 'content' ? t('Content', 'المحتوى')
                : t('Pricing', 'الأسعار')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'overview' && stats && (
          <>
            <View style={styles.statsGrid}>
              {[
                { label: t('Total Users', 'إجمالي المستخدمين'), value: stats.totalUsers, icon: 'people', color: colors.accent },
                { label: t('Active Today', 'نشطين اليوم'), value: stats.activeToday, icon: 'pulse', color: colors.success },
                { label: t('New This Week', 'جدد هذا الأسبوع'), value: stats.newThisWeek, icon: 'trending-up', color: colors.primary },
              ].map((s, i) => (
                <View key={i} style={[styles.statCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Ionicons name={s.icon as any} size={24} color={s.color} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Plan Breakdown', 'توزيع الخطط')}</Text>
            <View style={[styles.breakdownCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                <View key={plan} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownPlan, { color: colors.text }]}>{plan.toUpperCase()}</Text>
                  <View style={[styles.breakdownBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.breakdownFill, {
                      width: `${stats.totalUsers > 0 ? ((count as number) / stats.totalUsers) * 100 : 0}%`,
                      backgroundColor: plan === 'sultan' ? colors.primary : plan === 'pro' ? colors.accent : plan === 'basic' ? colors.muted : colors.faint,
                    }]} />
                  </View>
                  <Text style={[styles.breakdownCount, { color: colors.muted }]}>{count as number}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'users' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('All Users', 'كل المستخدمين')} ({allUsers?.length || 0})
            </Text>
            {(allUsers || []).map((u) => (
              <View key={u._id} testID={`admin-user-${u._id}`} style={[styles.userCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.userAvatarText}>{u.fullName.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName2, { color: colors.text }]}>{u.fullName}</Text>
                  <Text style={[styles.userEmail2, { color: colors.muted }]}>{u.email}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.planBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[{ color: colors.primary, fontSize: 10, fontWeight: '700' }]}>{u.plan.toUpperCase()}</Text>
                  </View>
                  <Text style={[{ color: colors.muted, fontSize: 10, marginTop: 4 }]}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === 'content' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Halal Guide', 'دليل الحلال والحرام')}</Text>
            {(halalGuide || []).map((item) => (
              <View key={item._id} style={[styles.halalCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <View style={[styles.halalBadge, { backgroundColor: item.isHalal ? colors.success + '20' : colors.danger + '20' }]}>
                  <Text style={{ color: item.isHalal ? colors.success : colors.danger, fontWeight: '700' }}>
                    {item.isHalal ? '✓ Halal' : '✗ Haram'}
                  </Text>
                </View>
                <Text style={[styles.halalName, { color: colors.text }]}>{item.nameEn}</Text>
                <Text style={[styles.halalReason, { color: colors.muted }]}>{item.reason}</Text>
              </View>
            ))}
          </>
        )}

        {activeTab === 'pricing' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Pricing Plans', 'خطط الأسعار')}</Text>
            {(plans || []).map((plan) => (
              <View key={plan._id} style={[styles.pricingCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <Text style={[styles.pricingName, { color: colors.primary }]}>{plan.nameEn}</Text>
                <View style={styles.pricingRow}>
                  <Text style={[{ color: colors.muted, fontSize: 12 }]}>Monthly</Text>
                  <Text style={[{ color: colors.text, fontWeight: '700' }]}>EGP {plan.priceMonthlyEGP}</Text>
                </View>
                <View style={styles.pricingRow}>
                  <Text style={[{ color: colors.muted, fontSize: 12 }]}>Yearly</Text>
                  <Text style={[{ color: colors.text, fontWeight: '700' }]}>EGP {plan.priceYearlyEGP}</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
  subTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subTabText: { fontSize: 12, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  breakdownCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownPlan: { width: 60, fontSize: 12, fontWeight: '700' },
  breakdownBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 4 },
  breakdownCount: { width: 30, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#0A0A0F', fontWeight: '700', fontSize: 14 },
  userName2: { fontSize: 14, fontWeight: '600' },
  userEmail2: { fontSize: 11, marginTop: 2 },
  planBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  halalCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  halalBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  halalName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  halalReason: { fontSize: 12 },
  pricingCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  pricingName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
});
