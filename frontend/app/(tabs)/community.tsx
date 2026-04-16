import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, FlatList, KeyboardAvoidingView, Platform, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const CATEGORIES = [
  { key: 'tip' as const, icon: '💡', en: 'Tip', ar: 'نصيحة' },
  { key: 'question' as const, icon: '❓', en: 'Question', ar: 'سؤال' },
  { key: 'success' as const, icon: '🏆', en: 'Success', ar: 'نجاح' },
  { key: 'discussion' as const, icon: '💬', en: 'Discussion', ar: 'نقاش' },
  { key: 'news' as const, icon: '📰', en: 'News', ar: 'أخبار' },
];

function PostCard({ post, convexUserId, colors, t, language, onComment }: any) {
  const toggleLike = useMutation(api.community.toggleLike);
  const deletePost = useMutation(api.community.deletePost);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLike = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    if (convexUserId) {
      await toggleLike({ postId: post._id, userId: convexUserId });
    }
  };

  const handleDelete = () => {
    if (post.userId === convexUserId) {
      Alert.alert(t('Delete Post?', 'حذف المنشور؟'), '', [
        { text: t('Cancel', 'إلغاء'), style: 'cancel' },
        { text: t('Delete', 'حذف'), style: 'destructive', onPress: () => deletePost({ postId: post._id }) },
      ]);
    }
  };

  const timeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return t('now', 'الآن');
    if (mins < 60) return `${mins}${t('m', 'د')}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${t('h', 'س')}`;
    return `${Math.floor(hrs / 24)}${t('d', 'ي')}`;
  };

  const cat = CATEGORIES.find((c) => c.key === post.category);

  return (
    <View style={[styles.postCard, { backgroundColor: colors.elevated, borderColor: colors.border }]}>
      <View style={styles.postHeader}>
        <View style={[styles.postAvatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.postAvatarText}>{post.authorName?.charAt(0) || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.postAuthor, { color: colors.text }]}>{post.authorName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.postTime, { color: colors.muted }]}>{timeAgo(post.createdAt)}</Text>
            {cat && (
              <View style={[styles.catBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={{ fontSize: 10 }}>{cat.icon} {language === 'ar' ? cat.ar : cat.en}</Text>
              </View>
            )}
          </View>
        </View>
        {post.userId === convexUserId && (
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.postContent, { color: colors.text }]}>{post.content}</Text>

      <View style={[styles.postActions, { borderTopColor: colors.border }]}>
        <TouchableOpacity testID={`like-${post._id}`} style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons name="heart-outline" size={20} color={colors.danger} />
          </Animated.View>
          <Text style={[styles.actionCount, { color: colors.muted }]}>{post.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity testID={`comment-${post._id}`} style={styles.actionBtn} onPress={() => onComment(post)}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.accent} />
          <Text style={[styles.actionCount, { color: colors.muted }]}>{post.commentsCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-outline" size={18} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommunityScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { t, language } = useLanguage();

  const convexUser = useQuery(api.users.getByAuthId, user?.authId ? { authId: user.authId } : 'skip');
  const feed = useQuery(api.community.getFeed);

  const createPost = useMutation(api.community.createPost);
  const addComment = useMutation(api.community.addComment);

  const [showNewPost, setShowNewPost] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<typeof CATEGORIES[number]['key']>('discussion');
  const [showComments, setShowComments] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  const comments = useQuery(
    api.community.getComments,
    showComments ? { postId: showComments._id } : 'skip'
  );

  const handlePost = async () => {
    if (!postContent.trim() || !convexUser) return;
    await createPost({
      userId: convexUser._id,
      authorName: convexUser.fullName,
      content: postContent.trim(),
      category: postCategory,
    });
    setPostContent('');
    setShowNewPost(false);
  };

  const handleComment = async () => {
    if (!commentText.trim() || !convexUser || !showComments) return;
    await addComment({
      postId: showComments._id,
      userId: convexUser._id,
      authorName: convexUser.fullName,
      content: commentText.trim(),
    });
    setCommentText('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>
          {t('Community', 'المجتمع')} 🔥
        </Text>
        <TouchableOpacity
          testID="new-post-btn"
          style={[styles.newPostBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowNewPost(true)}
        >
          <Ionicons name="add" size={18} color="#0A0A0F" />
          <Text style={styles.newPostBtnText}>{t('Post', 'انشر')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={feed || []}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.feedContent}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            convexUserId={convexUser?._id}
            colors={colors}
            t={t}
            language={language}
            onComment={setShowComments}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Text style={{ fontSize: 48 }}>🌟</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('Be the first to post!', 'كن أول من ينشر!')}
            </Text>
            <Text style={[styles.emptySub, { color: colors.muted }]}>
              {t('Share tips, ask questions, celebrate wins with the SULTAN community',
                'شارك نصائح، اسأل أسئلة، احتفل بنجاحاتك مع مجتمع سلطان')}
            </Text>
          </View>
        }
      />

      {/* New Post Modal */}
      <Modal visible={showNewPost} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowNewPost(false)}>
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {t('New Post', 'منشور جديد')}
                </Text>
                <TouchableOpacity
                  testID="submit-post-btn"
                  style={[styles.postSubmitBtn, { backgroundColor: postContent.trim() ? colors.primary : colors.elevated }]}
                  onPress={handlePost}
                  disabled={!postContent.trim()}
                >
                  <Text style={[styles.postSubmitText, { color: postContent.trim() ? '#0A0A0F' : colors.muted }]}>
                    {t('Post', 'انشر')}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[styles.catChip, { backgroundColor: postCategory === c.key ? colors.primary : colors.elevated, borderColor: colors.border }]}
                    onPress={() => setPostCategory(c.key)}
                  >
                    <Text>{c.icon}</Text>
                    <Text style={[{ color: postCategory === c.key ? '#0A0A0F' : colors.text, fontSize: 12 }]}>
                      {language === 'ar' ? c.ar : c.en}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                testID="post-content-input"
                style={[styles.postInput, { color: colors.text }]}
                placeholder={t("What's on your mind, Sultan? 👑", 'إيه اللي في بالك يا سلطان؟ 👑')}
                placeholderTextColor={colors.muted}
                value={postContent}
                onChangeText={setPostContent}
                multiline
                maxLength={1000}
                autoFocus
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={!!showComments} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.commentsModal, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('Comments', 'التعليقات')}
              </Text>
              <TouchableOpacity onPress={() => setShowComments(null)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments || []}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.commentItem, { borderColor: colors.border }]}>
                  <View style={[styles.commentAvatar, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: '#0A0A0F', fontWeight: '700', fontSize: 10 }}>
                      {item.authorName.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.commentAuthor, { color: colors.text }]}>{item.authorName}</Text>
                    <Text style={[styles.commentContent, { color: colors.textSecondary || colors.muted }]}>{item.content}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[{ color: colors.muted, textAlign: 'center', padding: 20 }]}>
                  {t('No comments yet', 'لا توجد تعليقات')}
                </Text>
              }
            />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={[styles.commentInputBar, { borderColor: colors.border, backgroundColor: colors.elevated }]}>
                <TextInput
                  testID="comment-input"
                  style={[styles.commentInput, { color: colors.text }]}
                  placeholder={t('Write a comment...', 'اكتب تعليق...')}
                  placeholderTextColor={colors.muted}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity testID="send-comment-btn" onPress={handleComment}>
                  <Ionicons name="send" size={20} color={commentText.trim() ? colors.primary : colors.muted} />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: 0.5 },
  newPostBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  newPostBtnText: { color: '#0A0A0F', fontWeight: '700', fontSize: 13 },
  feedContent: { padding: 12, paddingBottom: 20 },
  postCard: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: '#0A0A0F', fontWeight: '800', fontSize: 16 },
  postAuthor: { fontSize: 14, fontWeight: '700' },
  postTime: { fontSize: 11 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  postContent: { paddingHorizontal: 14, paddingBottom: 14, fontSize: 14, lineHeight: 22 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8, paddingHorizontal: 14, gap: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount: { fontSize: 13 },
  emptyFeed: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, minHeight: 300 },
  commentsModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', minHeight: '50%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  postSubmitBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  postSubmitText: { fontWeight: '700', fontSize: 14 },
  catRow: { marginBottom: 12, maxHeight: 40 },
  catChip: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8, gap: 4, alignItems: 'center' },
  postInput: { fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  commentItem: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5 },
  commentAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  commentAuthor: { fontSize: 12, fontWeight: '700' },
  commentContent: { fontSize: 13, marginTop: 2 },
  commentInputBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, gap: 10 },
  commentInput: { flex: 1, fontSize: 14, minHeight: 36 },
});
