import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const INCOME_RANGES = ['< 5,000 EGP', '5,000 - 15,000', '15,000 - 30,000', '30,000+', 'Student'];
const GOALS_EN = ['Save money', 'Beat inflation', 'Buy gold', 'Start a side hustle', 'Pay off debt', 'Build emergency fund', 'Invest halal'];
const GOALS_AR = ['ادخار المال', 'التغلب على التضخم', 'شراء ذهب', 'بدء عمل إضافي', 'سداد الديون', 'بناء صندوق طوارئ', 'الاستثمار الحلال'];
const CURRENCIES = [
  { code: 'EGP' as const, flag: '🇪🇬', name: 'Egyptian Pound' },
  { code: 'SAR' as const, flag: '🇸🇦', name: 'Saudi Riyal' },
  { code: 'AED' as const, flag: '🇦🇪', name: 'UAE Dirham' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, setConvexUserId } = useAuth();
  const { colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [step, setStep] = useState(1);
  const [selectedLang, setSelectedLang] = useState<'ar' | 'en'>(language);
  const [selectedCurrency, setSelectedCurrency] = useState<'EGP' | 'SAR' | 'AED'>('EGP');
  const [selectedIncome, setSelectedIncome] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const createUser = useMutation(api.users.createUser);
  const updateOnboarding = useMutation(api.users.updateOnboarding);

  const handleNext = async () => {
    if (step < 4) {
      if (step === 1) setLanguage(selectedLang);
      setStep(step + 1);
      return;
    }

    // Step 4 - complete onboarding
    try {
      if (user) {
        const convexId = await createUser({
          authId: user.authId,
          email: user.email,
          fullName: user.fullName,
          language: selectedLang,
          currency: selectedCurrency,
          incomeRange: selectedIncome || 'Student',
          goals: selectedGoals.length > 0 ? selectedGoals : ['Save money'],
        });
        if (convexId) {
          await updateOnboarding({
            userId: convexId,
            language: selectedLang,
            currency: selectedCurrency,
            incomeRange: selectedIncome || 'Student',
            goals: selectedGoals.length > 0 ? selectedGoals : ['Save money'],
          });
          setConvexUserId(convexId as string);
        }
      }
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Onboarding error:', e);
      router.replace('/(tabs)');
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {t('Choose Language', 'اختر اللغة')}
            </Text>
            <View style={styles.optionsList}>
              {[
                { code: 'en' as const, flag: '🇬🇧', label: 'English' },
                { code: 'ar' as const, flag: '🇪🇬', label: 'العربية' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  testID={`lang-${lang.code}`}
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.elevated, borderColor: selectedLang === lang.code ? colors.primary : colors.border },
                  ]}
                  onPress={() => setSelectedLang(lang.code)}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{lang.label}</Text>
                  {selectedLang === lang.code && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {t('Select Currency', 'اختر العملة')}
            </Text>
            <View style={styles.optionsList}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  testID={`currency-${c.code}`}
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.elevated, borderColor: selectedCurrency === c.code ? colors.primary : colors.border },
                  ]}
                  onPress={() => setSelectedCurrency(c.code)}
                >
                  <Text style={styles.flag}>{c.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{c.code}</Text>
                    <Text style={[styles.optionSub, { color: colors.muted }]}>{c.name}</Text>
                  </View>
                  {selectedCurrency === c.code && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {t('Monthly Income', 'الدخل الشهري')}
            </Text>
            <View style={styles.optionsList}>
              {INCOME_RANGES.map((range) => (
                <TouchableOpacity
                  key={range}
                  testID={`income-${range.replace(/[^a-zA-Z0-9]/g, '')}`}
                  style={[
                    styles.incomeCard,
                    { backgroundColor: colors.elevated, borderColor: selectedIncome === range ? colors.primary : colors.border },
                  ]}
                  onPress={() => setSelectedIncome(range)}
                >
                  <Text style={[styles.optionLabel, { color: colors.text }]}>{range}</Text>
                  {selectedIncome === range && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              {t('Your Goals', 'أهدافك المالية')}
            </Text>
            <View style={styles.chipContainer}>
              {GOALS_EN.map((goal, i) => {
                const isSelected = selectedGoals.includes(goal);
                return (
                  <TouchableOpacity
                    key={goal}
                    testID={`goal-${i}`}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.elevated,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => toggleGoal(goal)}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#0A0A0F' : colors.text }]}>
                      {selectedLang === 'ar' ? GOALS_AR[i] : goal}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.stepLabel, { color: colors.muted }]}>
          {t(`Step ${step} of 4`, `الخطوة ${step} من 4`)}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {renderStep()}
      </ScrollView>

      <View style={styles.bottomBar}>
        {step > 1 && (
          <TouchableOpacity testID="onboarding-back" onPress={() => setStep(step - 1)} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.muted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          testID="onboarding-next"
          style={[styles.nextButton, { backgroundColor: colors.primary, flex: step > 1 ? 1 : undefined }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {step === 4 ? t("Let's Go! 🚀", 'يلا نبدأ! 🚀') : t('Next', 'التالي')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressContainer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  progressBg: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepLabel: { fontSize: 12, marginTop: 8 },
  scroll: { paddingHorizontal: 24, paddingBottom: 100 },
  stepContent: { paddingTop: 24 },
  stepTitle: { fontSize: 28, fontWeight: '800', marginBottom: 24 },
  optionsList: { gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 16,
  },
  incomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  flag: { fontSize: 32 },
  optionLabel: { fontSize: 18, fontWeight: '600' },
  optionSub: { fontSize: 13, marginTop: 2 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
    alignItems: 'center',
  },
  backButton: { padding: 12 },
  nextButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  nextButtonText: { color: '#0A0A0F', fontSize: 16, fontWeight: '700' },
});
