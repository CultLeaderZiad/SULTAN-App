import { Linking, Alert, Platform } from 'react-native';

// Owner contact details
export const OWNER = {
  whatsappNumber: '201557242579', // +20 1557242579 (no leading 0, no plus)
  email: 'cultleaderzoz.dev@gmail.com',
  whatsappDisplay: '+20 1557242579',
};

// InstaPay handle (replace with real handle when ready)
export const INSTAPAY_HANDLE = 'cultleaderzoz@instapay'; // placeholder
export const VODAFONE_CASH = '01557242579';

export interface PlanInfo {
  nameEn: string;
  nameAr: string;
  price: number;
  currency: string;
  cycle: 'monthly' | 'yearly';
}

function safeOpen(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert(
      'Could not open',
      Platform.OS === 'web'
        ? 'Please allow popups for this site or copy the link manually.'
        : 'The required app is not installed on this device.'
    );
  });
}

function buildSubscriptionMessage(plan: PlanInfo, language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return (
      `السلام عليكم،\n\n` +
      `عاوز أرقي حسابي في سلطان لخطة ${plan.nameAr} (${plan.cycle === 'yearly' ? 'سنوي' : 'شهري'})\n` +
      `السعر: ${plan.currency} ${plan.price}\n\n` +
      `ممكن تبعتلي تفاصيل الدفع؟`
    );
  }
  return (
    `Hello,\n\n` +
    `I'd like to upgrade my SULTAN account to the ${plan.nameEn} plan (${plan.cycle}).\n` +
    `Price: ${plan.currency} ${plan.price}\n\n` +
    `Please send me payment instructions. I have more questions about the plan as well.`
  );
}

function buildGenericMessage(language: 'en' | 'ar'): string {
  if (language === 'ar') {
    return 'السلام عليكم، عندي سؤال عن تطبيق سلطان.';
  }
  return 'Hello, I have a question about the SULTAN app.';
}

export function openWhatsAppForPlan(plan: PlanInfo, language: 'en' | 'ar' = 'en') {
  const msg = buildSubscriptionMessage(plan, language);
  const url = `https://wa.me/${OWNER.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  safeOpen(url);
}

export function openWhatsAppGeneric(language: 'en' | 'ar' = 'en') {
  const msg = buildGenericMessage(language);
  const url = `https://wa.me/${OWNER.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  safeOpen(url);
}

export function openEmailForPlan(plan: PlanInfo, language: 'en' | 'ar' = 'en') {
  const subject = `SULTAN Subscription - ${plan.nameEn} (${plan.cycle})`;
  const body = buildSubscriptionMessage(plan, language);
  const url = `mailto:${OWNER.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  safeOpen(url);
}

export function openEmailGeneric(language: 'en' | 'ar' = 'en') {
  const subject = 'SULTAN App Inquiry';
  const body = buildGenericMessage(language);
  const url = `mailto:${OWNER.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  safeOpen(url);
}

export function showInstaPayDetails(
  plan: PlanInfo,
  language: 'en' | 'ar',
  onConfirm: () => void
) {
  const en = `Send EGP ${plan.price} via InstaPay to:\n\n${INSTAPAY_HANDLE}\n\nThen tap "I have paid" and we'll activate your ${plan.nameEn} plan within 24 hours.`;
  const ar = `حوّل ${plan.price} جنيه على إنستاباي:\n\n${INSTAPAY_HANDLE}\n\nبعد كدا اضغط "دفعت" وهنفعل خطة ${plan.nameAr} خلال 24 ساعة.`;
  Alert.alert(
    language === 'ar' ? 'الدفع بإنستاباي' : 'Pay with InstaPay',
    language === 'ar' ? ar : en,
    [
      { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
      { text: language === 'ar' ? 'دفعت' : 'I have paid', onPress: onConfirm },
    ]
  );
}

export function showVodafoneCashDetails(
  plan: PlanInfo,
  language: 'en' | 'ar',
  onConfirm: () => void
) {
  const en = `Send EGP ${plan.price} via Vodafone Cash to:\n\n${VODAFONE_CASH}\n\nThen tap "I have paid" and we'll activate your ${plan.nameEn} plan within 24 hours.`;
  const ar = `حوّل ${plan.price} جنيه على فودافون كاش:\n\n${VODAFONE_CASH}\n\nبعد كدا اضغط "دفعت" وهنفعل خطة ${plan.nameAr} خلال 24 ساعة.`;
  Alert.alert(
    language === 'ar' ? 'الدفع بفودافون كاش' : 'Pay with Vodafone Cash',
    language === 'ar' ? ar : en,
    [
      { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
      { text: language === 'ar' ? 'دفعت' : 'I have paid', onPress: onConfirm },
    ]
  );
}
