import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

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

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch (e) {
    console.log('Error getting push token:', e);
    return null;
  }
}

// ─── LOCAL NOTIFICATION HELPERS ───

export async function sendBudgetAlert(
  category: string,
  spentPercent: number,
  currency: string,
  spent: number,
  limit: number,
  language: string = 'en'
) {
  const title = language === 'ar' ? '⚠️ تحذير ميزانية' : '⚠️ Budget Warning';
  const body = language === 'ar'
    ? `صرفت ${spentPercent.toFixed(0)}% من ميزانية ${category}!\n${currency} ${spent.toLocaleString()} من ${currency} ${limit.toLocaleString()}`
    : `You've spent ${spentPercent.toFixed(0)}% of your ${category} budget!\n${currency} ${spent.toLocaleString()} of ${currency} ${limit.toLocaleString()}`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'budget_alert', category },
      ...(Platform.OS === 'android' && { channelId: 'sultan-budget' }),
    },
    trigger: null, // Immediate
  });
}

export async function sendGoldPriceAlert(
  karat: number,
  priceEGP: number,
  changePercent: number,
  language: string = 'en'
) {
  const direction = changePercent > 0 ? '📈' : '📉';
  const title = language === 'ar'
    ? `${direction} تنبيه سعر الذهب ${karat}K`
    : `${direction} Gold ${karat}K Price Alert`;
  const body = language === 'ar'
    ? `سعر الذهب ${karat} قيراط: ${priceEGP.toLocaleString()} جنيه/جرام\nتغيير: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`
    : `Gold ${karat}K: EGP ${priceEGP.toLocaleString()}/gram\nChange: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'gold_alert', karat },
      ...(Platform.OS === 'android' && { channelId: 'sultan-gold' }),
    },
    trigger: null,
  });
}

export async function sendInflationAlert(
  rate: number,
  language: string = 'en'
) {
  const title = language === 'ar' ? '🔴 تنبيه التضخم' : '🔴 Inflation Alert';
  const body = language === 'ar'
    ? `معدل التضخم في مصر وصل ${rate}%!\nفلوسك بتفقد قيمتها. افتح سلطان لنصائح البقاء.`
    : `Egypt's inflation rate hit ${rate}%!\nYour money is losing value. Open SULTAN for survival tips.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'inflation_alert' },
      ...(Platform.OS === 'android' && { channelId: 'sultan-alerts' }),
    },
    trigger: null,
  });
}

export async function scheduleDailyGoldCheck(language: string = 'en') {
  // Cancel any existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Schedule a daily reminder to check gold prices (9 AM)
  const title = language === 'ar' ? '🪙 تحقق من سعر الذهب' : '🪙 Check Gold Prices';
  const body = language === 'ar'
    ? 'صباح الخير يا سلطان! تحقق من أسعار الذهب اليوم'
    : 'Good morning Sultan! Check today\'s gold prices';

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'daily_gold' },
      ...(Platform.OS === 'android' && { channelId: 'sultan-gold' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 9,
      minute: 0,
    },
  });
}

// Check budget and trigger alerts
export async function checkBudgetAlerts(
  budgets: Array<{ category: string; limitAmount: number; spentAmount: number; alertAt: number }>,
  currency: string,
  language: string
) {
  for (const budget of budgets) {
    const percent = budget.limitAmount > 0 ? (budget.spentAmount / budget.limitAmount) * 100 : 0;
    if (percent >= budget.alertAt) {
      await sendBudgetAlert(budget.category, percent, currency, budget.spentAmount, budget.limitAmount, language);
    }
  }
}

// Check gold prices and trigger alert if significant change
export async function checkGoldPriceChange(
  currentPrices: Array<{ karat: number; pricePerGramEGP: number; change24h: number }>,
  language: string,
  threshold: number = 2.0
) {
  for (const price of currentPrices) {
    if (Math.abs(price.change24h) >= threshold) {
      await sendGoldPriceAlert(price.karat, price.pricePerGramEGP, price.change24h, language);
    }
  }
}
