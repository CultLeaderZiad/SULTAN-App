import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const KARAT_OPTIONS = [18, 21, 24] as const;
const INVEST_TYPES = [
  { key: 'gold', icon: '🪙', en: 'Gold', ar: 'ذهب' },
  { key: 'real_estate', icon: '🏢', en: 'Real Estate', ar: 'عقارات' },
  { key: 'sukuk', icon: '📜', en: 'Sukuk', ar: 'صكوك' },
  { key: 'halal_stocks', icon: '📊', en: 'Halal Stocks', ar: 'أسهم حلال' },
  { key: 'savings', icon: '🏦', en: 'Savings', ar: 'مدخرات' },
  { key: 'other', icon: '💼', en: 'Other', ar: 'أخرى' },
] as const;

export default function InvestScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');
  const goldPrices = useQuery(api.gold.getLatestGoldPrices);
  const goldHoldings = useQuery(api.gold.getGoldHoldings, convexUser?._id ? { userId: convexUser._id } : 'skip');
  const investments = useQuery(api.investments.getInvestments, convexUser?._id ? { userId: convexUser._id } : 'skip');

  const [activeTab, setActiveTab] = useState<'gold' | 'investments' | 'calculator'>('gold');
  const [showAddGold, setShowAddGold] = useState(false);
  const [showAddInvest, setShowAddInvest] = useState(false);

  // Gold form
  const [goldGrams, setGoldGrams] = useState('');
  const [goldKarat, setGoldKarat] = useState<18 | 21 | 24>(21);
  const [goldPrice, setGoldPrice] = useState('');

  // Investment form
  const [investType, setInvestType] = useState<typeof INVEST_TYPES[number]['key']>('gold');
  const [investName, setInvestName] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [investHalal, setInvestHalal] = useState(true);

  // Calculator
  const [calcGrams, setCalcGrams] = useState('');
  const [calcMonths, setCalcMonths] = useState('12');
  const [calcAmount, setCalcAmount] = useState('');

  const addGold = useMutation(api.gold.addGoldHolding);
  const addInvestment = useMutation(api.investments.addInvestment);
  const deleteGold = useMutation(api.gold.deleteGoldHolding);

  const handleAddGold = async () => {
    if (!goldGrams || !goldPrice || !convexUser) return;
    await addGold({
      userId: convexUser._id,
      gramsOwned: parseFloat(goldGrams),
      karat: goldKarat,
      purchasePrice: parseFloat(goldPrice),
      purchaseCurrency: convexUser.currency || 'EGP',
      purchaseDate: Date.now(),
    });
    setShowAddGold(false);
    setGoldGrams('');
    setGoldPrice('');
  };

  const handleAddInvestment = async () => {
    if (!investName || !investAmount || !convexUser) return;
    await addInvestment({
      userId: convexUser._id,
      type: investType,
      name: investName,
      amountInvested: parseFloat(investAmount),
      currency: convexUser.currency || 'EGP',
      isHalal: investHalal,
      startDate: Date.now(),
    });
    setShowAddInvest(false);
    setInvestName('');
    setInvestAmount('');
  };

  const totalGoldValue = (goldHoldings || []).reduce((sum, h) => {
    const price = goldPrices?.find((p) => p.karat === h.karat);
    return sum + (price ? h.gramsOwned * price.pricePerGramEGP : 0);
  }, 0);

  const totalInvestValue = (investments || []).reduce((sum, i) => sum + (i.currentValue || i.amountInvested), 0);

  // Calculator logic
  const gold21Price = goldPrices?.find((p) => p.karat === 21)?.pricePerGramEGP || 3325;
  const calcGoldReturn = calcAmount
    ? parseFloat(calcAmount) * (1 + 0.25) // ~25% gold appreciation estimate
    : 0;
  const calcBankReturn = calcAmount
    ? parseFloat(calcAmount) * (1 + 0.135 * (parseInt(calcMonths) / 12)) // 13.5% bank rate
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Sub-tabs */}
      <View style={[styles.tabRow, { borderColor: colors.border }]}>
        {(['gold', 'investments', 'calculator'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            testID={`invest-tab-${tab}`}
            style={[styles.subTab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.subTabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>
              {tab === 'gold' ? t('Gold', 'الذهب') : tab === 'investments' ? t('Investments', 'الاستثمارات') : t('Calculator', 'الحاسبة')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {activeTab === 'gold' && (
          <>
            {/* Live Prices */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Live Gold Prices', 'أسعار الذهب الحية')}</Text>
            <View style={styles.priceCards}>
              {(goldPrices || []).map((p) => (
                <View key={p.karat} style={[styles.priceCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Text style={[styles.karatLabel, { color: colors.primary }]}>{p.karat}K</Text>
                  <Text style={[styles.priceValue, { color: colors.text }]}>EGP {p.pricePerGramEGP.toLocaleString()}</Text>
                  <Text style={[styles.priceUsd, { color: colors.muted }]}>${p.pricePerGramUSD}/g</Text>
                </View>
              ))}
            </View>

            {/* My Holdings */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('My Gold', 'ذهبي')}</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>EGP {totalGoldValue.toLocaleString()}</Text>
            </View>

            {(goldHoldings || []).map((h) => {
              const price = goldPrices?.find((p) => p.karat === h.karat);
              const currentVal = price ? h.gramsOwned * price.pricePerGramEGP : 0;
              const profit = currentVal - h.purchasePrice;
              return (
                <TouchableOpacity
                  key={h._id}
                  testID={`gold-holding-${h._id}`}
                  style={[styles.holdingCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}
                  onLongPress={() => Alert.alert(t('Delete?', 'حذف؟'), '', [
                    { text: t('Cancel', 'إلغاء'), style: 'cancel' },
                    { text: t('Delete', 'حذف'), style: 'destructive', onPress: () => deleteGold({ holdingId: h._id }) },
                  ])}
                >
                  <View>
                    <Text style={[styles.holdingGrams, { color: colors.text }]}>{h.gramsOwned}g — {h.karat}K</Text>
                    <Text style={[styles.holdingDate, { color: colors.muted }]}>
                      {t('Bought', 'مشتري')} {new Date(h.purchaseDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.holdingValue, { color: colors.text }]}>EGP {currentVal.toLocaleString()}</Text>
                    <Text style={[{ color: profit >= 0 ? colors.success : colors.danger, fontSize: 12, fontWeight: '600' }]}>
                      {profit >= 0 ? '+' : ''}{profit.toLocaleString()} EGP
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              testID="add-gold-btn"
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddGold(true)}
            >
              <Ionicons name="add" size={20} color="#0A0A0F" />
              <Text style={styles.addBtnText}>{t('Add Gold', 'أضف ذهب')}</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'investments' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Portfolio', 'المحفظة')}</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>EGP {totalInvestValue.toLocaleString()}</Text>
            </View>

            {(investments || []).map((inv) => {
              const typeInfo = INVEST_TYPES.find((it) => it.key === inv.type);
              return (
                <View key={inv._id} testID={`invest-${inv._id}`} style={[styles.investCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 28 }}>{typeInfo?.icon || '💼'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.investName, { color: colors.text }]}>{inv.name}</Text>
                    <Text style={[styles.investType, { color: colors.muted }]}>
                      {language === 'ar' ? typeInfo?.ar : typeInfo?.en}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.investAmount, { color: colors.text }]}>
                      {inv.currency} {(inv.currentValue || inv.amountInvested).toLocaleString()}
                    </Text>
                    {inv.isHalal ? (
                      <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={{ color: colors.success, fontSize: 10, fontWeight: '700' }}>✓ {t('Halal', 'حلال')}</Text>
                      </View>
                    ) : (
                      <View style={[styles.badge, { backgroundColor: colors.danger + '20' }]}>
                        <Text style={{ color: colors.danger, fontSize: 10, fontWeight: '700' }}>✗ {t('Haram', 'حرام')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {(!investments || investments.length === 0) && (
              <View style={styles.emptyInvest}>
                <Ionicons name="pie-chart-outline" size={48} color={colors.muted} />
                <Text style={[{ color: colors.muted, marginTop: 8 }]}>{t('No investments yet', 'لا توجد استثمارات')}</Text>
              </View>
            )}

            <TouchableOpacity
              testID="add-invest-btn"
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddInvest(true)}
            >
              <Ionicons name="add" size={20} color="#0A0A0F" />
              <Text style={styles.addBtnText}>{t('Add Investment', 'أضف استثمار')}</Text>
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'calculator' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Gold vs Bank', 'الذهب ضد البنك')}</Text>
            <View style={[styles.calcCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              <TextInput
                testID="calc-amount"
                style={[styles.calcInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                placeholder={t('Amount in EGP', 'المبلغ بالجنيه')}
                placeholderTextColor={colors.muted}
                value={calcAmount}
                onChangeText={setCalcAmount}
                keyboardType="numeric"
              />
              <TextInput
                testID="calc-months"
                style={[styles.calcInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                placeholder={t('Months', 'عدد الأشهر')}
                placeholderTextColor={colors.muted}
                value={calcMonths}
                onChangeText={setCalcMonths}
                keyboardType="numeric"
              />

              {calcAmount ? (
                <View style={styles.calcResults}>
                  <View style={[styles.calcResult, { borderColor: colors.primary }]}>
                    <Text style={{ fontSize: 24 }}>🪙</Text>
                    <Text style={[styles.calcLabel, { color: colors.primary }]}>{t('Gold Return', 'عائد الذهب')}</Text>
                    <Text style={[styles.calcValue, { color: colors.text }]}>EGP {calcGoldReturn.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.calcResult, { borderColor: colors.accent }]}>
                    <Text style={{ fontSize: 24 }}>🏦</Text>
                    <Text style={[styles.calcLabel, { color: colors.accent }]}>{t('Bank Return', 'عائد البنك')}</Text>
                    <Text style={[styles.calcValue, { color: colors.text }]}>EGP {calcBankReturn.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.winner, { backgroundColor: calcGoldReturn > calcBankReturn ? colors.primary + '20' : colors.accent + '20' }]}>
                    <Text style={[styles.winnerText, { color: calcGoldReturn > calcBankReturn ? colors.primary : colors.accent }]}>
                      {calcGoldReturn > calcBankReturn
                        ? t('🏆 Gold wins! Better hedge against inflation', '🏆 الذهب أفضل! حماية أقوى من التضخم')
                        : t('🏦 Bank wins for this period', '🏦 البنك أفضل لهذه الفترة')}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            {/* Zakat Calculator */}
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>{t('Zakat Calculator', 'حاسبة الزكاة')}</Text>
            <View style={[styles.calcCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
              <Text style={[styles.zakatInfo, { color: colors.muted }]}>
                {t(
                  'Zakat is 2.5% on wealth above nisab (~21g of gold)',
                  'الزكاة 2.5% على المال فوق النصاب (~21 جرام ذهب)'
                )}
              </Text>
              <View style={styles.zakatRow}>
                <Text style={[{ color: colors.text, fontSize: 14 }]}>{t('Nisab threshold', 'حد النصاب')}</Text>
                <Text style={[{ color: colors.primary, fontWeight: '700' }]}>EGP {(21 * gold21Price).toLocaleString()}</Text>
              </View>
              {totalGoldValue + totalInvestValue > 21 * gold21Price && (
                <View style={[styles.zakatDue, { backgroundColor: colors.success + '15' }]}>
                  <Text style={[{ color: colors.success, fontWeight: '700', fontSize: 16 }]}>
                    {t('Zakat Due', 'الزكاة المستحقة')}: EGP {((totalGoldValue + totalInvestValue) * 0.025).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add Gold Modal */}
      <Modal visible={showAddGold} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('Add Gold', 'أضف ذهب')}</Text>
                <TouchableOpacity onPress={() => setShowAddGold(false)}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <TextInput testID="gold-grams-input" style={[styles.mInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]} placeholder={t('Grams', 'الجرامات')} placeholderTextColor={colors.muted} value={goldGrams} onChangeText={setGoldGrams} keyboardType="numeric" />
              <View style={styles.karatRow}>
                {KARAT_OPTIONS.map((k) => (
                  <TouchableOpacity key={k} style={[styles.karatBtn, { backgroundColor: goldKarat === k ? colors.primary : colors.elevated, borderColor: colors.border }]} onPress={() => setGoldKarat(k)}>
                    <Text style={[{ color: goldKarat === k ? '#0A0A0F' : colors.text, fontWeight: '700' }]}>{k}K</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput testID="gold-price-input" style={[styles.mInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]} placeholder={t('Total Purchase Price', 'إجمالي سعر الشراء')} placeholderTextColor={colors.muted} value={goldPrice} onChangeText={setGoldPrice} keyboardType="numeric" />
              <TouchableOpacity testID="save-gold-btn" style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddGold}>
                <Text style={styles.saveBtnText}>{t('Save', 'حفظ')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Add Investment Modal */}
      <Modal visible={showAddInvest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('Add Investment', 'أضف استثمار')}</Text>
                <TouchableOpacity onPress={() => setShowAddInvest(false)}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {INVEST_TYPES.map((it) => (
                  <TouchableOpacity key={it.key} style={[styles.investTypeChip, { backgroundColor: investType === it.key ? colors.primary : colors.elevated, borderColor: colors.border }]} onPress={() => setInvestType(it.key)}>
                    <Text>{it.icon}</Text>
                    <Text style={[{ color: investType === it.key ? '#0A0A0F' : colors.text, fontSize: 12 }]}>
                      {language === 'ar' ? it.ar : it.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput testID="invest-name-input" style={[styles.mInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]} placeholder={t('Investment Name', 'اسم الاستثمار')} placeholderTextColor={colors.muted} value={investName} onChangeText={setInvestName} />
              <TextInput testID="invest-amount-input" style={[styles.mInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.elevated }]} placeholder={t('Amount', 'المبلغ')} placeholderTextColor={colors.muted} value={investAmount} onChangeText={setInvestAmount} keyboardType="numeric" />
              <TouchableOpacity testID="save-invest-btn" style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleAddInvestment}>
                <Text style={styles.saveBtnText}>{t('Save', 'حفظ')}</Text>
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
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  subTab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  subTabText: { fontSize: 14, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 20 },
  totalValue: { fontSize: 18, fontWeight: '800' },
  priceCards: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  priceCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  karatLabel: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  priceValue: { fontSize: 15, fontWeight: '700' },
  priceUsd: { fontSize: 11, marginTop: 2 },
  holdingCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  holdingGrams: { fontSize: 16, fontWeight: '700' },
  holdingDate: { fontSize: 11, marginTop: 2 },
  holdingValue: { fontSize: 16, fontWeight: '700' },
  investCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 12 },
  investName: { fontSize: 15, fontWeight: '600' },
  investType: { fontSize: 12, marginTop: 2 },
  investAmount: { fontSize: 15, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  emptyInvest: { alignItems: 'center', paddingVertical: 40 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, marginTop: 16, gap: 8 },
  addBtnText: { color: '#0A0A0F', fontSize: 14, fontWeight: '700' },
  calcCard: { padding: 16, borderRadius: 14, borderWidth: 1 },
  calcInput: { height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 16, marginBottom: 10, fontSize: 15 },
  calcResults: { gap: 10, marginTop: 8 },
  calcResult: { padding: 14, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  calcLabel: { fontSize: 13, fontWeight: '600' },
  calcValue: { fontSize: 18, fontWeight: '800', marginLeft: 'auto' },
  winner: { padding: 12, borderRadius: 10, alignItems: 'center' },
  winnerText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  zakatInfo: { fontSize: 13, marginBottom: 12 },
  zakatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  zakatDue: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  mInput: { height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 16, marginBottom: 12, fontSize: 15 },
  karatRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  karatBtn: { flex: 1, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  investTypeChip: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8, gap: 6 },
  saveBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  saveBtnText: { color: '#0A0A0F', fontSize: 15, fontWeight: '700' },
});
