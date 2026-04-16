import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const GOAL_CATEGORIES = [
  { key: 'emergency', emoji: '🛟', en: 'Emergency Fund', ar: 'صندوق طوارئ' },
  { key: 'dream', emoji: '🌟', en: 'Dream Purchase', ar: 'حلم شراء' },
  { key: 'travel', emoji: '✈️', en: 'Travel', ar: 'سفر' },
  { key: 'education', emoji: '📚', en: 'Education', ar: 'تعليم' },
  { key: 'business', emoji: '💼', en: 'Business', ar: 'عمل' },
];

export default function SavingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');
  const goals = useQuery(api.savingsGoals.getGoals, convexUser?._id ? { userId: convexUser._id } : 'skip');

  const createGoal = useMutation(api.savingsGoals.createGoal);
  const addToGoal = useMutation(api.savingsGoals.addToGoal);
  const deleteGoal = useMutation(api.savingsGoals.deleteGoal);

  const [showAdd, setShowAdd] = useState(false);
  const [showDeposit, setShowDeposit] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState('emergency');
  const [depositAmount, setDepositAmount] = useState('');

  const handleCreate = async () => {
    if (!title || !target || !convexUser) return;
    const cat = GOAL_CATEGORIES.find((c) => c.key === category)!;
    await createGoal({
      userId: convexUser._id,
      title,
      targetAmount: parseFloat(target),
      currency: convexUser.currency || 'EGP',
      category: cat.key,
      emoji: cat.emoji,
    });
    setShowAdd(false);
    setTitle('');
    setTarget('');
  };

  const handleDeposit = async () => {
    if (!depositAmount || !showDeposit) return;
    await addToGoal({ goalId: showDeposit as any, amount: parseFloat(depositAmount) });
    setShowDeposit(null);
    setDepositAmount('');
  };

  const totalSaved = (goals || []).reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = (goals || []).reduce((s, g) => s + g.targetAmount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity testID="savings-back" onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('Savings Goals', 'أهداف الادخار')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Overview */}
        <View style={[styles.overviewCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
          <View style={styles.overviewRow}>
            <View>
              <Text style={[styles.overviewLabel, { color: colors.muted }]}>{t('Total Saved', 'إجمالي المدخرات')}</Text>
              <Text style={[styles.overviewValue, { color: colors.primary }]}>
                {convexUser?.currency || 'EGP'} {totalSaved.toLocaleString()}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.overviewLabel, { color: colors.muted }]}>{t('Target', 'الهدف')}</Text>
              <Text style={[styles.overviewValue, { color: colors.text }]}>
                {convexUser?.currency || 'EGP'} {totalTarget.toLocaleString()}
              </Text>
            </View>
          </View>
          <View style={[styles.overviewBar, { backgroundColor: colors.border }]}>
            <View style={[styles.overviewFill, { width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Goal Cards */}
        {(goals || []).map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const daysLeft = goal.targetDate ? Math.max(0, Math.ceil((goal.targetDate - Date.now()) / 86400000)) : null;
          const status = goal.isCompleted ? 'completed' : progress >= 80 ? 'on-track' : 'behind';

          return (
            <TouchableOpacity
              key={goal._id}
              testID={`goal-${goal._id}`}
              style={[styles.goalCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}
              onPress={() => setShowDeposit(goal._id)}
              onLongPress={() => Alert.alert(t('Delete?', 'حذف؟'), '', [
                { text: t('Cancel', 'إلغاء'), style: 'cancel' },
                { text: t('Delete', 'حذف'), style: 'destructive', onPress: () => deleteGoal({ goalId: goal._id }) },
              ])}
            >
              <View style={styles.goalHeader}>
                <Text style={{ fontSize: 32 }}>{goal.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.goalTitle, { color: colors.text }]}>{goal.title}</Text>
                  <Text style={[styles.goalMeta, { color: colors.muted }]}>
                    {goal.currency} {goal.currentAmount.toLocaleString()} / {goal.targetAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, {
                  backgroundColor: status === 'completed' ? colors.success + '20' : status === 'on-track' ? colors.accent + '20' : colors.danger + '20',
                }]}>
                  <Text style={{
                    fontSize: 10, fontWeight: '700',
                    color: status === 'completed' ? colors.success : status === 'on-track' ? colors.accent : colors.danger,
                  }}>
                    {status === 'completed' ? '✓ ' + t('Done', 'تم') : status === 'on-track' ? t('On Track', 'على المسار') : t('Behind', 'متأخر')}
                  </Text>
                </View>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.isCompleted ? colors.success : colors.primary }]} />
              </View>
              {daysLeft !== null && !goal.isCompleted && (
                <Text style={[styles.daysLeft, { color: colors.muted }]}>
                  {daysLeft} {t('days remaining', 'يوم متبقي')}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {(!goals || goals.length === 0) && (
          <View style={styles.emptyGoals}>
            <Text style={{ fontSize: 48 }}>🎯</Text>
            <Text style={[{ color: colors.muted, marginTop: 8 }]}>{t('No savings goals yet', 'لا توجد أهداف ادخار')}</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity testID="add-goal-fab" style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#0A0A0F" />
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('New Goal', 'هدف جديد')}</Text>
                <TouchableOpacity onPress={() => setShowAdd(false)}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <TextInput testID="goal-title-input" style={[styles.mInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]} placeholder={t('Goal Title', 'عنوان الهدف')} placeholderTextColor={colors.muted} value={title} onChangeText={setTitle} />
              <TextInput testID="goal-target-input" style={[styles.mInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]} placeholder={t('Target Amount', 'المبلغ المستهدف')} placeholderTextColor={colors.muted} value={target} onChangeText={setTarget} keyboardType="numeric" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {GOAL_CATEGORIES.map((c) => (
                  <TouchableOpacity key={c.key} style={[styles.catChip, { backgroundColor: category === c.key ? colors.primary : colors.elevated, borderColor: colors.border }]} onPress={() => setCategory(c.key)}>
                    <Text>{c.emoji}</Text>
                    <Text style={[{ color: category === c.key ? '#0A0A0F' : colors.text, fontSize: 12 }]}>{language === 'ar' ? c.ar : c.en}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity testID="create-goal-btn" style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleCreate}>
                <Text style={styles.saveBtnText}>{t('Create Goal', 'إنشاء الهدف')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Deposit Modal */}
      <Modal visible={!!showDeposit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('Add Money', 'إضافة مبلغ')}</Text>
                <TouchableOpacity onPress={() => setShowDeposit(null)}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <TextInput testID="deposit-amount-input" style={[styles.mInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]} placeholder={t('Amount', 'المبلغ')} placeholderTextColor={colors.muted} value={depositAmount} onChangeText={setDepositAmount} keyboardType="numeric" />
              <TouchableOpacity testID="deposit-btn" style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleDeposit}>
                <Text style={styles.saveBtnText}>{t('Deposit', 'إيداع')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 100 },
  overviewCard: { padding: 20, borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  overviewLabel: { fontSize: 12 },
  overviewValue: { fontSize: 22, fontWeight: '800' },
  overviewBar: { height: 6, borderRadius: 3 },
  overviewFill: { height: '100%', borderRadius: 3 },
  goalCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  goalTitle: { fontSize: 16, fontWeight: '700' },
  goalMeta: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  daysLeft: { fontSize: 11, marginTop: 6 },
  emptyGoals: { alignItems: 'center', paddingVertical: 40 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  mInput: { height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 16, marginBottom: 12, fontSize: 15 },
  catChip: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, gap: 6 },
  saveBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#0A0A0F', fontSize: 15, fontWeight: '700' },
});
