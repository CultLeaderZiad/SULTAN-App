import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const CATEGORIES = [
  { key: 'food', icon: '🍔', en: 'Food & Drinks', ar: 'طعام ومشروبات' },
  { key: 'transport', icon: '🚗', en: 'Transport', ar: 'المواصلات' },
  { key: 'housing', icon: '🏠', en: 'Housing', ar: 'السكن' },
  { key: 'shopping', icon: '🛍️', en: 'Shopping', ar: 'التسوق' },
  { key: 'health', icon: '🏥', en: 'Health', ar: 'الصحة' },
  { key: 'education', icon: '📚', en: 'Education', ar: 'التعليم' },
  { key: 'entertainment', icon: '🎮', en: 'Entertainment', ar: 'الترفيه' },
  { key: 'utilities', icon: '💡', en: 'Utilities', ar: 'المرافق' },
  { key: 'salary', icon: '💰', en: 'Salary', ar: 'الراتب' },
  { key: 'freelance', icon: '💻', en: 'Freelance', ar: 'عمل حر' },
  { key: 'investment', icon: '📈', en: 'Investment', ar: 'استثمار' },
  { key: 'gift', icon: '🎁', en: 'Gift', ar: 'هدية' },
  { key: 'other', icon: '📋', en: 'Other', ar: 'أخرى' },
];

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');

  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [txnType, setTxnType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  const [isHalal, setIsHalal] = useState(true);
  const [sourceType, setSourceType] = useState<'salary' | 'freelance' | 'side_hustle' | 'investment' | 'gift' | 'other'>('other');

  const transactions = useQuery(
    api.transactions.getTransactions,
    convexUser?._id
      ? { userId: convexUser._id, ...(filter !== 'all' ? { type: filter } : {}) }
      : 'skip'
  );

  const now = new Date();
  const summary = useQuery(
    api.transactions.getMonthlySummary,
    convexUser?._id ? { userId: convexUser._id, month: now.getMonth() + 1, year: now.getFullYear() } : 'skip'
  );

  const addTransaction = useMutation(api.transactions.addTransaction);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  const handleAdd = async () => {
    if (!amount || !description || !convexUser) {
      Alert.alert('Error', t('Please fill amount and description', 'أدخل المبلغ والوصف'));
      return;
    }
    try {
      const amountNum = parseFloat(amount);
      await addTransaction({
        userId: convexUser._id,
        type: txnType,
        amount: amountNum,
        currency: convexUser.currency || 'EGP',
        amountEGP: amountNum,
        category,
        description,
        note: note || undefined,
        isHalal,
        isRecurring: false,
        sourceType,
        date: Date.now(),
      });
      setShowAddModal(false);
      setAmount('');
      setDescription('');
      setNote('');
    } catch (e) {
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const handleDelete = (id: any) => {
    Alert.alert(t('Delete', 'حذف'), t('Delete this transaction?', 'حذف هذه المعاملة؟'), [
      { text: t('Cancel', 'إلغاء'), style: 'cancel' },
      { text: t('Delete', 'حذف'), style: 'destructive', onPress: () => deleteTransaction({ transactionId: id }) },
    ]);
  };

  const getCategoryInfo = (key: string) => CATEGORIES.find((c) => c.key === key) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Monthly Summary */}
      <View style={[styles.summaryBar, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t('Income', 'الدخل')}</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>
            +{(summary?.totalIncome || 0).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t('Expenses', 'المصاريف')}</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>
            -{(summary?.totalExpenses || 0).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t('Savings', 'الادخار')}</Text>
          <Text style={[styles.summaryValue, { color: colors.accent }]}>
            {(summary?.savingsRate || 0).toFixed(0)}%
          </Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            testID={`filter-${f}`}
            style={[
              styles.filterBtn,
              { backgroundColor: filter === f ? colors.primary : colors.elevated, borderColor: colors.border },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? '#0A0A0F' : colors.text }]}>
              {f === 'all' ? t('All', 'الكل') : f === 'income' ? t('Income', 'دخل') : t('Expenses', 'مصاريف')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      <FlatList
        data={transactions || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const cat = getCategoryInfo(item.category);
          return (
            <TouchableOpacity
              testID={`txn-${item._id}`}
              style={[styles.txnRow, { backgroundColor: colors.elevated, borderColor: colors.border }]}
              onLongPress={() => handleDelete(item._id)}
            >
              <Text style={styles.txnEmoji}>{cat.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.txnDesc, { color: colors.text }]}>{item.description}</Text>
                <Text style={[styles.txnMeta, { color: colors.muted }]}>
                  {language === 'ar' ? cat.ar : cat.en} · {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.txnAmount, { color: item.type === 'income' ? colors.success : colors.danger }]}>
                  {item.type === 'income' ? '+' : '-'}{item.currency} {item.amount.toLocaleString()}
                </Text>
                {item.isHalal && (
                  <View style={styles.halalBadge}>
                    <Text style={{ fontSize: 10, color: colors.success }}>✓ {t('Halal', 'حلال')}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {t('No transactions yet', 'لا توجد معاملات')}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        testID="add-transaction-fab"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#0A0A0F" />
      </TouchableOpacity>

      {/* Add Transaction Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('Add Transaction', 'إضافة معاملة')}
                </Text>
                <TouchableOpacity testID="close-modal" onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>

              {/* Type Toggle */}
              <View style={[styles.typeToggle, { backgroundColor: colors.elevated }]}>
                <TouchableOpacity
                  testID="type-expense"
                  style={[styles.typeBtn, txnType === 'expense' && { backgroundColor: colors.danger }]}
                  onPress={() => setTxnType('expense')}
                >
                  <Text style={[styles.typeText, { color: txnType === 'expense' ? '#fff' : colors.muted }]}>
                    {t('Expense', 'مصروف')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  testID="type-income"
                  style={[styles.typeBtn, txnType === 'income' && { backgroundColor: colors.success }]}
                  onPress={() => setTxnType('income')}
                >
                  <Text style={[styles.typeText, { color: txnType === 'income' ? '#fff' : colors.muted }]}>
                    {t('Income', 'دخل')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                testID="txn-amount-input"
                style={[styles.amountInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]}
                placeholder={t('Amount', 'المبلغ')}
                placeholderTextColor={colors.muted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <TextInput
                testID="txn-desc-input"
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]}
                placeholder={t('Description', 'الوصف')}
                placeholderTextColor={colors.muted}
                value={description}
                onChangeText={setDescription}
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.catChip,
                      { backgroundColor: category === c.key ? colors.primary : colors.elevated, borderColor: colors.border },
                    ]}
                    onPress={() => setCategory(c.key)}
                  >
                    <Text>{c.icon}</Text>
                    <Text style={[styles.catLabel, { color: category === c.key ? '#0A0A0F' : colors.text }]}>
                      {language === 'ar' ? c.ar : c.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.halalToggle}>
                <TouchableOpacity
                  testID="halal-toggle"
                  style={[styles.toggleRow, { backgroundColor: colors.elevated }]}
                  onPress={() => setIsHalal(!isHalal)}
                >
                  <Ionicons name={isHalal ? 'checkmark-circle' : 'close-circle'} size={22} color={isHalal ? colors.success : colors.danger} />
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    {isHalal ? t('Halal ✓', 'حلال ✓') : t('Not Halal', 'غير حلال')}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                testID="save-transaction-btn"
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
                activeOpacity={0.8}
              >
                <Text style={styles.saveBtnText}>{t('Save Transaction', 'حفظ المعاملة')}</Text>
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
  summaryBar: {
    flexDirection: 'row',
    margin: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  divider: { width: 1, height: '100%' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  txnEmoji: { fontSize: 28 },
  txnDesc: { fontSize: 14, fontWeight: '600' },
  txnMeta: { fontSize: 11, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: '700' },
  halalBadge: { marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#C8A96E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  typeToggle: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  typeText: { fontSize: 14, fontWeight: '600' },
  amountInput: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 15,
  },
  catScroll: { marginBottom: 12, maxHeight: 44 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  catLabel: { fontSize: 12, fontWeight: '500' },
  halalToggle: { marginBottom: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8 },
  toggleLabel: { fontSize: 14, fontWeight: '500' },
  saveBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700' },
});
