import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const QUICK_PROMPTS_EN = [
  'How do I save more?',
  'Is gold better than bank now?',
  'How to start a side hustle?',
  'Analyse my spending',
  '6-month savings plan',
];
const QUICK_PROMPTS_AR = [
  'كيف أوفر أكثر؟',
  'هل الذهب أفضل من البنك دلوقتي؟',
  'ازاي أبدأ side hustle؟',
  'حللي مصاريفي',
  'خطة ادخار 6 شهور',
];

export default function AdvisorScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');
  const messages = useQuery(api.chatMessages.getMessages, convexUser?._id ? { userId: convexUser._id } : 'skip');
  const addMessage = useMutation(api.chatMessages.addMessage);
  const clearMessages = useMutation(api.chatMessages.clearMessages);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sessionId = useRef(`sultan_chat_${user?.authId || 'anon'}_${Date.now()}`).current;

  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !convexUser || loading) return;
    setInput('');
    setLoading(true);

    await addMessage({ userId: convexUser._id, role: 'user', content: text.trim() });

    try {
      const resp = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          message: text.trim(),
          session_id: sessionId,
          language,
          user_context: `User: ${convexUser.fullName}, Currency: ${convexUser.currency}, Income: ${convexUser.incomeRange}`,
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        await addMessage({ userId: convexUser._id, role: 'assistant', content: data.response });
      } else {
        await addMessage({
          userId: convexUser._id,
          role: 'assistant',
          content: language === 'ar'
            ? 'عذراً، حصل مشكلة. حاول تاني.'
            : 'Sorry, something went wrong. Please try again.',
        });
      }
    } catch (e) {
      await addMessage({
        userId: convexUser._id,
        role: 'assistant',
        content: language === 'ar'
          ? 'تأكد من اتصالك بالإنترنت وحاول مرة أخرى.'
          : 'Check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = language === 'ar' ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
            <Text style={{ fontSize: 20 }}>👑</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>SULTAN AI</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>
              {t('Your Financial Advisor', 'مستشارك المالي')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          testID="clear-chat-btn"
          onPress={() => convexUser && clearMessages({ userId: convexUser._id })}
        >
          <Ionicons name="trash-outline" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.chatContent}
        renderItem={({ item }) => (
          <View
            testID={`msg-${item._id}`}
            style={[
              styles.msgBubble,
              item.role === 'user'
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.aiBubble, { backgroundColor: colors.elevated }],
            ]}
          >
            <Text style={[styles.msgText, { color: item.role === 'user' ? '#0A0A0F' : colors.text }]}>
              {item.content}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={{ fontSize: 48 }}>👑</Text>
            <Text style={[styles.emptyChatTitle, { color: colors.primary }]}>
              {t('SULTAN AI Advisor', 'المستشار المالي سلطان')}
            </Text>
            <Text style={[styles.emptyChatSub, { color: colors.muted }]}>
              {t(
                'Ask me anything about money, gold, inflation, or side hustles in Egypt',
                'اسألني عن أي حاجة تخص الفلوس والذهب والتضخم والشغل الإضافي في مصر'
              )}
            </Text>
            <View style={styles.promptsContainer}>
              {quickPrompts.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  testID={`quick-prompt-${i}`}
                  style={[styles.promptChip, { borderColor: colors.border, backgroundColor: colors.elevated }]}
                  onPress={() => sendMessage(p)}
                >
                  <Text style={[styles.promptText, { color: colors.text }]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {loading && (
        <View style={[styles.typingIndicator, { backgroundColor: colors.elevated }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.typingText, { color: colors.muted }]}>
            {t('SULTAN is thinking...', 'سلطان بيفكر...')}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            testID="chat-input"
            style={[styles.chatInput, { color: colors.text, backgroundColor: colors.elevated }]}
            placeholder={t('Ask SULTAN...', 'اسأل سلطان...')}
            placeholderTextColor={colors.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            testID="send-message-btn"
            style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.elevated }]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color={input.trim() ? '#0A0A0F' : colors.muted} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  headerSub: { fontSize: 11 },
  chatContent: { padding: 16, paddingBottom: 8 },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, lineHeight: 20 },
  emptyChat: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyChatTitle: { fontSize: 22, fontWeight: '800', marginTop: 12, letterSpacing: 1 },
  emptyChatSub: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  promptsContainer: { marginTop: 24, gap: 8, width: '100%' },
  promptChip: { padding: 12, borderRadius: 12, borderWidth: 1 },
  promptText: { fontSize: 13 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  typingText: { fontSize: 12 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
