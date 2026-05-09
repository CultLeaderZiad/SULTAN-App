import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');
  const isSuperAdmin = convexUser?.role === 'super_admin';
  const isAdmin = convexUser?.role === 'admin' || isSuperAdmin;

  type Tab = 'overview' | 'users' | 'admins' | 'content' | 'pricing' | 'logs';
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const stats = useQuery(api.admin.getUserStats);
  const allUsers = useQuery(api.admin.getAllUsers);
  const allAdmins = useQuery(api.admin.getAllAdmins);
  const plans = useQuery(api.pricingPlans.getPlans);
  const halalGuide = useQuery(api.halalGuide.getAll);
  const adminLogs = useQuery(api.admin.getAdminLogs, isSuperAdmin ? {} : 'skip');

  const updatePlan = useMutation(api.admin.updateUserPlan);
  const deleteUser = useMutation(api.admin.deleteUser);
  const promoteToAdmin = useMutation(api.admin.promoteToAdmin);
  const demoteAdmin = useMutation(api.admin.demoteAdmin);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={48} color={colors.muted} />
          <Text style={[styles.lockedTitle, { color: colors.text }]}>
            {t('Admin Only', 'للإدارة فقط')}
          </Text>
          <Text style={[styles.lockedSub, { color: colors.muted }]}>
            {t('You do not have access to this section', 'ليس لديك صلاحية للدخول على هذا القسم')}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{t('Back', 'رجوع')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const askPlanChange = (userId: any, currentPlan: string) => {
    Alert.alert(
      t('Change Plan', 'تغيير الخطة'),
      `Current: ${currentPlan.toUpperCase()}`,
      [
        { text: 'Trial', onPress: () => updatePlan({ userId, plan: 'trial' }) },
        { text: 'Basic', onPress: () => updatePlan({ userId, plan: 'basic' }) },
        { text: 'Pro', onPress: () => updatePlan({ userId, plan: 'pro' }) },
        { text: 'Sultan', onPress: () => updatePlan({ userId, plan: 'sultan' }) },
        { text: t('Cancel', 'إلغاء'), style: 'cancel' },
      ]
    );
  };

  const askDeleteUser = (userId: any, name: string) => {
    if (!convexUser?._id) return;
    Alert.alert(
      t('Delete user?', 'حذف المستخدم؟'),
      name,
      [
        { text: t('Cancel', 'إلغاء'), style: 'cancel' },
        {
          text: t('Delete', 'حذف'),
          style: 'destructive',
          onPress: () => {
            deleteUser({ adminId: convexUser._id as any, targetId: userId }).catch((e: any) =>
              Alert.alert('Error', e?.message || 'Failed')
            );
          },
        },
      ]
    );
  };

  const askPromote = (userId: any, name: string) => {
    if (!convexUser?._id) return;
    Alert.alert(t('Promote to Admin?', 'ترقية لإداري؟'), name, [
      { text: t('Cancel', 'إلغاء'), style: 'cancel' },
      {
        text: t('Promote', 'ترقية'),
        onPress: () =>
          promoteToAdmin({ adminId: convexUser._id as any, targetId: userId }).catch((e: any) =>
            Alert.alert('Error', e?.message || 'Failed')
          ),
      },
    ]);
  };

  const askDemote = (userId: any, name: string) => {
    if (!convexUser?._id) return;
    Alert.alert(t('Demote Admin?', 'تخفيض الإداري؟'), name, [
      { text: t('Cancel', 'إلغاء'), style: 'cancel' },
      {
        text: t('Demote', 'تخفيض'),
        style: 'destructive',
        onPress: () =>
          demoteAdmin({ adminId: convexUser._id as any, targetId: userId }).catch((e: any) =>
            Alert.alert('Error', e?.message || 'Failed')
          ),
      },
    ]);
  };

  const tabs: { key: Tab; en: string; ar: string }[] = [
    { key: 'overview', en: 'Overview', ar: 'نظرة' },
    { key: 'users', en: 'Users', ar: 'المستخدمين' },
    ...(isSuperAdmin ? [{ key: 'admins' as Tab, en: 'Admins', ar: 'الإداريين' }] : []),
    { key: 'content', en: 'Content', ar: 'المحتوى' },
    { key: 'pricing', en: 'Pricing', ar: 'الأسعار' },
    ...(isSuperAdmin ? [{ key: 'logs' as Tab, en: 'Logs', ar: 'السجل' }] : []),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="admin-back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>
            {isSuperAdmin ? t('Super Admin', 'سوبر أدمن') : t('Admin Dashboard', 'لوحة الإدارة')} 👑
          </Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {convexUser?.fullName || ''}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow} style={[styles.tabBar, { borderColor: colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            testID={`admin-tab-${tab.key}`}
            style={[styles.subTab, activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.subTabText, { color: activeTab === tab.key ? colors.primary : colors.muted }]}>
              {t(tab.en, tab.ar)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                  <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.muted }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.mrrCard, { backgroundColor: colors.primary }]}>
              <Text style={styles.mrrLabel}>{t('Estimated MRR', 'الإيراد الشهري المتوقع')}</Text>
              <Text style={styles.mrrValue}>EGP {stats.mrrEGP.toLocaleString()}</Text>
              <Text style={styles.mrrSub}>{stats.adminCount + stats.superAdminCount} {t('admins total', 'إداريين')}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Plan Breakdown', 'توزيع الخطط')}</Text>
            <View style={[styles.breakdownCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                <View key={plan} style={styles.breakdownRow}>
                  <Text style={[styles.breakdownPlan, { color: colors.text }]}>{plan.toUpperCase()}</Text>
                  <View style={[styles.breakdownBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[styles.breakdownFill, {
                        width: `${stats.totalUsers > 0 ? ((count as number) / stats.totalUsers) * 100 : 0}%`,
                        backgroundColor: plan === 'sultan' ? colors.primary : plan === 'pro' ? colors.accent : plan === 'basic' ? colors.muted : colors.faint,
                      }]}
                    />
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
            {(allUsers || []).map((u: any) => (
              <View key={u._id} testID={`admin-user-${u._id}`} style={[styles.userCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: colors.primary }]}>
                  <Text style={styles.userAvatarText}>{u.fullName?.charAt(0) || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName2, { color: colors.text }]}>
                    {u.fullName} {u.role === 'super_admin' && '👑'} {u.role === 'admin' && '★'}
                  </Text>
                  <Text style={[styles.userEmail2, { color: colors.muted }]}>{u.email || u.authId}</Text>
                </View>
                <TouchableOpacity onPress={() => askPlanChange(u._id, u.plan)} style={[styles.planBadge2, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[{ color: colors.primary, fontSize: 10, fontWeight: '700' }]}>{u.plan?.toUpperCase()}</Text>
                </TouchableOpacity>
                {u.role === 'user' && isSuperAdmin && (
                  <TouchableOpacity onPress={() => askPromote(u._id, u.fullName)} style={styles.iconBtn}>
                    <Ionicons name="arrow-up-circle" size={22} color={colors.success} />
                  </TouchableOpacity>
                )}
                {u.role !== 'super_admin' && (
                  <TouchableOpacity onPress={() => askDeleteUser(u._id, u.fullName)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {activeTab === 'admins' && isSuperAdmin && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('Admin Team', 'فريق الإدارة')} ({allAdmins?.length || 0})
            </Text>
            {(allAdmins || []).map((u: any) => (
              <View key={u._id} style={[styles.userCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <View style={[styles.userAvatar, { backgroundColor: u.role === 'super_admin' ? colors.primary : colors.accent }]}>
                  <Text style={styles.userAvatarText}>{u.fullName?.charAt(0) || '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userName2, { color: colors.text }]}>
                    {u.fullName} {u.role === 'super_admin' ? '👑' : '★'}
                  </Text>
                  <Text style={[styles.userEmail2, { color: colors.muted }]}>{u.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: u.role === 'super_admin' ? colors.primary + '20' : colors.accent + '20' }]}>
                  <Text style={{ color: u.role === 'super_admin' ? colors.primary : colors.accent, fontSize: 10, fontWeight: '700' }}>
                    {u.role === 'super_admin' ? 'SUPER' : 'ADMIN'}
                  </Text>
                </View>
                {u.role === 'admin' && (
                  <TouchableOpacity onPress={() => askDemote(u._id, u.fullName)} style={styles.iconBtn}>
                    <Ionicons name="arrow-down-circle" size={22} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

        {activeTab === 'content' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('Halal Guide', 'دليل الحلال والحرام')} ({halalGuide?.length || 0})
            </Text>
            {(halalGuide || []).map((item: any) => (
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
            {(plans || []).map((plan: any) => (
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

        {activeTab === 'logs' && isSuperAdmin && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('Recent Admin Actions', 'أحدث إجراءات الإدارة')}
            </Text>
            {(adminLogs || []).slice(-50).reverse().map((log: any) => (
              <View key={log._id} style={[styles.logCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                <Text style={[styles.logAction, { color: colors.primary }]}>{log.action}</Text>
                <Text style={[styles.logDetails, { color: colors.text }]}>{log.details || log.targetId || ''}</Text>
                <Text style={[styles.logDate, { color: colors.muted }]}>{new Date(log.createdAt).toLocaleString()}</Text>
              </View>
            ))}
            {(adminLogs?.length || 0) === 0 && (
              <Text style={[{ color: colors.muted, textAlign: 'center', padding: 20 }]}>
                {t('No admin actions yet', 'لا توجد إجراءات بعد')}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 11, marginTop: 2 },
  tabBar: { borderBottomWidth: 1 },
  tabRow: { paddingHorizontal: 8 },
  subTab: { paddingHorizontal: 16, paddingVertical: 12 },
  subTabText: { fontSize: 13, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  mrrCard: { padding: 20, borderRadius: 16, marginBottom: 16, alignItems: 'center' },
  mrrLabel: { color: '#0A0A0F', fontSize: 12, fontWeight: '600', opacity: 0.7 },
  mrrValue: { color: '#0A0A0F', fontSize: 32, fontWeight: '900', marginVertical: 4 },
  mrrSub: { color: '#0A0A0F', fontSize: 11, opacity: 0.7 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  breakdownCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  breakdownPlan: { width: 60, fontSize: 12, fontWeight: '700' },
  breakdownBar: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 4 },
  breakdownCount: { width: 30, textAlign: 'right', fontSize: 12, fontWeight: '600' },
  userCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#0A0A0F', fontWeight: '700', fontSize: 14 },
  userName2: { fontSize: 14, fontWeight: '600' },
  userEmail2: { fontSize: 11, marginTop: 2 },
  planBadge2: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  iconBtn: { padding: 4 },
  halalCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  halalBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 },
  halalName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  halalReason: { fontSize: 12 },
  pricingCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  pricingName: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  pricingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  logCard: { padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  logAction: { fontSize: 13, fontWeight: '700' },
  logDetails: { fontSize: 12, marginTop: 2 },
  logDate: { fontSize: 10, marginTop: 4 },
  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  lockedTitle: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  lockedSub: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  backBtn: { paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderRadius: 10 },
});
