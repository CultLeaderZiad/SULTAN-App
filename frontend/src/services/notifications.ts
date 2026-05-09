import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Web has no native push module; bail out early to prevent runtime crashes.
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Configure notification behavior (only on native; calling on web throws)
if (isNative) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    if (__DEV__) console.warn('[notifications] setNotificationHandler failed', e);
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!isNative) return null;
  if (!Device.isDevice) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sultan-alerts', {
        name: 'SULTAN Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C8A96E',
      });
      await Notifications.setNotificationChannelAsync('sultan-gold', {
        name: 'Gold Price Alerts',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await Notifications.setNotificationChannelAsync('sultan-budget', {
        name: 'Budget Warnings',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token ?? null;
  } catch (e) {
    if (__DEV__) console.warn('[notifications] register failed', e);
    return null;
  }
}

async function safeSchedule(content: Notifications.NotificationContentInput, trigger: any = null) {
  if (!isNative) return;
  try {
    await Notifications.scheduleNotificationAsync({ content, trigger });
  } catch (e) {
    if (__DEV__) console.warn('[notifications] schedule failed', e);
  }
}

export async function sendBudgetAlert(
  category: string,
  spentPercent: number,
  currency: string,
  spent: number,
  limit: number,
  language: string = 'en'
) {
  if (!isNative) return;
  const title = language === 'ar' ? '⚠️ تحذير ميزانية' : '⚠️ Budget Warning';
  const body = language === 'ar'
    ? `صرفت ${spentPercent.toFixed(0)}% من ميزانية ${category}!\n${currency} ${spent.toLocaleString()} من ${currency} ${limit.toLocaleString()}`
    : `You've spent ${spentPercent.toFixed(0)}% of your ${category} budget!\n${currency} ${spent.toLocaleString()} of ${currency} ${limit.toLocaleString()}`;

  await safeSchedule({
    title,
    body,
    data: { type: 'budget_alert', category },
    ...(Platform.OS === 'android' && { channelId: 'sultan-budget' }),
  });
}

export async function sendGoldPriceAlert(
  karat: number,
  priceEGP: number,
  changePercent: number,
  language: string = 'en'
) {
  if (!isNative) return;
  const direction = changePercent > 0 ? '📈' : '📉';
  const title = language === 'ar'
    ? `${direction} تنبيه سعر الذهب ${karat}K`
    : `${direction} Gold ${karat}K Price Alert`;
  const body = language === 'ar'
    ? `سعر الذهب ${karat} قيراط: ${priceEGP.toLocaleString()} جنيه/جرام\nتغيير: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
    : `Gold ${karat}K: EGP ${priceEGP.toLocaleString()}/gram\nChange: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`;

  await safeSchedule({
    title,
    body,
    data: { type: 'gold_alert', karat },
    ...(Platform.OS === 'android' && { channelId: 'sultan-gold' }),
  });
}

export async function sendInflationAlert(rate: number, language: string = 'en') {
  if (!isNative) return;
  const title = language === 'ar' ? '🔴 تنبيه التضخم' : '🔴 Inflation Alert';
  const body = language === 'ar'
    ? `معدل التضخم في مصر وصل ${rate}%!\nفلوسك بتفقد قيمتها. افتح سلطان لنصائح البقاء.`
    : `Egypt's inflation rate hit ${rate}%!\nYour money is losing value. Open SULTAN for survival tips.`;

  await safeSchedule({
    title,
    body,
    data: { type: 'inflation_alert' },
    ...(Platform.OS === 'android' && { channelId: 'sultan-alerts' }),
  });
}

export async function scheduleDailyGoldCheck(language: string = 'en') {
  if (!isNative) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    if (__DEV__) console.warn('[notifications] cancelAll failed', e);
  }

  const title = language === 'ar' ? '🪙 تحقق من سعر الذهب' : '🪙 Check Gold Prices';
  const body = language === 'ar'
    ? 'صباح الخير يا سلطان! تحقق من أسعار الذهب اليوم'
    : 'Good morning Sultan! Check today\'s gold prices';

  await safeSchedule(
    {
      title,
      body,
      data: { type: 'daily_gold' },
      ...(Platform.OS === 'android' && { channelId: 'sultan-gold' }),
    },
    {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    }
  );
}

export async function checkBudgetAlerts(
  budgets: Array<{ category: string; limitAmount: number; spentAmount: number; alertAt: number }>,
  currency: string,
  language: string
) {
  if (!isNative) return;
  for (const budget of budgets) {
    const percent = budget.limitAmount > 0 ? (budget.spentAmount / budget.limitAmount) * 100 : 0;
    if (percent >= budget.alertAt) {
      await sendBudgetAlert(budget.category, percent, currency, budget.spentAmount, budget.limitAmount, language);
    }
  }
}

export async function checkGoldPriceChange(
  currentPrices: Array<{ karat: number; pricePerGramEGP: number; change24h: number }>,
  language: string,
  threshold: number = 2.0
) {
  if (!isNative) return;
  for (const price of currentPrices) {
    if (Math.abs(price.change24h) >= threshold) {
      await sendGoldPriceAlert(price.karat, price.pricePerGramEGP, price.change24h, language);
    }
  }
}
