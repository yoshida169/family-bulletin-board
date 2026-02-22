import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { useAuthStore } from '@/src/store/authStore';
import { postService } from '@/src/services/firebase/post';

const MAX_CONTENT_LENGTH = 1000;

export default function CreatePostScreen() {
  const router = useRouter();
  const { familyId, boardId } = useLocalSearchParams<{
    familyId: string;
    boardId: string;
  }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user } = useAuthStore();

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('エラー', '投稿内容を入力してください');
      return;
    }

    if (!user) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }

    if (!familyId || !boardId) {
      Alert.alert('エラー', 'ファミリーまたは掲示板が選択されていません');
      return;
    }

    setIsSubmitting(true);
    try {
      await postService.createPost({
        familyId,
        boardId,
        content: content.trim(),
        authorId: user.uid,
        authorName: user.displayName ?? '名無し',
        authorPhotoURL: user.photoURL,
      });
      router.back();
    } catch (error) {
      console.error('Failed to create post:', error);
      Alert.alert('エラー', '投稿に失敗しました。もう一度お試しください');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: '新しい投稿',
          headerRight: () => (
            <Button
              label="投稿"
              onPress={handleSubmit}
              disabled={!content.trim() || isOverLimit || isSubmitting}
              loading={isSubmitting}
              size="sm"
            />
          ),
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['left', 'right', 'bottom']}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Content input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                placeholder="今日の出来事や家族へのメッセージを書いてみましょう..."
                placeholderTextColor={colors.textSecondary}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={MAX_CONTENT_LENGTH + 100}
                textAlignVertical="top"
                autoFocus
              />
            </View>

            {/* Character count */}
            <View style={styles.charCountContainer}>
              <Text
                style={[
                  styles.charCount,
                  { color: isOverLimit ? colors.error : colors.textSecondary },
                ]}
              >
                {remainingChars}
              </Text>
            </View>

            {/* Tips */}
            <View style={[styles.tipsContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.tipsTitle, { color: colors.text }]}>
                投稿のヒント
              </Text>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  日常の小さな出来事も共有しましょう
                </Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                  写真は次のアップデートで追加予定です
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.md,
  },
  inputContainer: {
    marginBottom: Layout.spacing.sm,
  },
  textInput: {
    minHeight: 200,
    fontSize: 16,
    lineHeight: 24,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderRadius: 12,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginBottom: Layout.spacing.lg,
  },
  charCount: {
    fontSize: 14,
  },
  tipsContainer: {
    padding: Layout.spacing.md,
    borderRadius: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.xs,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
});
