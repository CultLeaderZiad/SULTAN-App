import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, mode, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');
  const updateUser = useMutation(api.users.updateUser);

  const handleLanguageToggle = async () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    if (convexUser) {
      await updateUser({ userId: convexUser._id, language: newLang });
    }
  };

  const handleLogout = () => {
    Alert.alert(t('Logout', 'تسجيل الخروج'), t('Are you sure?', 'هل أنت متأكد؟'), [
      { text: t('Cancel', 'إلغاء'), style: 'cancel' },
      { text: t('Logout', 'خروج'), style: 'destructive', onPress: () => { logout(); router.replace('/'); } },
    ]);
  };

  const planColors: Record<string, string> = {
    trial: '#4A9EFF',
    basic: '#9A9A9A',
    pro: '#C8A96E',
    sultan: '#E6C98A',
  };

  const sections = [
    {
      title: t('Preferences', 'التفضيلات'),
      items: [
        {
          icon: 'language',
          label: t('Language', 'اللغة'),
          value: language === 'ar' ? 'العربية' : 'English',
          onPress: handleLanguageToggle,
        },
        {
          icon: 'moon',
          label: t('Dark Mode', 'الوضع الداكن'),
          isSwitch: true,
          switchValue: mode === 'dark',
          onToggle: toggleTheme,
        },
        {
          icon: 'cash',
          label: t('Currency', 'العملة'),
          value: convexUser?.currency || 'EGP',
        },
      ],
    },
    {
      title: t('App', 'التطبيق'),
      items: [
        { icon: 'diamond', label: t('Subscription', 'الاشتراك'), onPress: () => router.push('/subscription') },
        { icon: 'flag', label: t('Savings Goals', 'أهداف الادخار'), onPress: () => router.push('/savings') },
        { icon: 'shield-checkmark', label: t('Inflation Guide', 'دليل التضخم'), onPress: () => router.push('/inflation') },
      ],
    },
    {
      title: t('Account', 'الحساب'),
      items: [
        { icon: 'log-out', label: t('Logout', 'تسجيل الخروج'), onPress: handleLogout, danger: true },
      ],
    },
  ];

  // Add admin section if user is admin
  if (convexUser?.role === 'admin') {
    sections.splice(2, 0, {
      title: t('Admin', 'الإدارة'),
      items: [
        { icon: 'settings', label: t('Admin Dashboard', 'لوحة الإدارة'), onPress: () => router.push('/admin') },
      ],
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Card */}
        <View testID="profile-card" style={[styles.profileCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {(convexUser?.fullName || user?.fullName || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {convexUser?.fullName || user?.fullName || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.muted }]}>
            {user?.email || ''}
          </Text>
          <View style={[styles.planBadge, { backgroundColor: planColors[convexUser?.plan || 'trial'] + '20' }]}>
            <Text style={[styles.planText, { color: planColors[convexUser?.plan || 'trial'] }]}>
              {(convexUser?.plan || 'trial').toUpperCase()} {t('Plan', 'خطة')}
            </Text>
          </View>
        </View>

        {/* Settings Sections */}
        {sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              {section.items.map((item: any, ii) => (
                <TouchableOpacity
                  key={ii}
                  testID={`setting-${item.icon}`}
                  style={[
                    styles.settingRow,
                    ii < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  onPress={item.onPress}
                  disabled={item.isSwitch}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={20}
                    color={item.danger ? colors.danger : colors.primary}
                  />
                  <Text style={[styles.settingLabel, { color: item.danger ? colors.danger : colors.text }]}>
                    {item.label}
                  </Text>
                  {item.value && (
                    <Text style={[styles.settingValue, { color: colors.muted }]}>{item.value}</Text>
                  )}
                  {item.isSwitch ? (
                    <Switch
                      value={item.switchValue}
                      onValueChange={item.onToggle}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#fff"
                    />
                  ) : !item.danger ? (
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={[styles.versionText, { color: colors.faint }]}>
          SULTAN v1.0.0 · {t('Developed by Ziad Sabry', 'تطوير زياد صبري')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  profileCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#0A0A0F' },
  userName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  userEmail: { fontSize: 13, marginBottom: 12 },
  planBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
  planText: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' },
  sectionCard: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  settingValue: { fontSize: 13 },
  versionText: { textAlign: 'center', fontSize: 11, marginTop: 16 },
});
