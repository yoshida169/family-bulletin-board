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
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { useAuthStore } from '@/src/store/authStore';
import { useFamilyStore } from '@/src/store/familyStore';

const MAX_CONTENT_LENGTH = 1000;

export default function CreatePostScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user } = useAuthStore();
  const { currentFamily, createPost } = useFamilyStore();

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

    if (!currentFamily) {
      Alert.alert('エラー', 'ファミリーが選択されていません');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost(
        content.trim(),
        user.id,
        user.displayName,
        user.photoURL
      );
      router.back();
    } catch (error) {
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
              title="投稿"
              onPress={handleSubmit}
              disabled={!content.trim() || isOverLimit || isSubmitting}
              loading={isSubmitting}
              size="small"
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
            {/* Family indicator */}
            <View style={[styles.familyInfo, { backgroundColor: colors.surface }]}>
              <Ionicons name="people" size={16} color={colors.primary} />
              <Text style={[styles.familyName, { color: colors.text }]}>
                {currentFamily?.name ?? 'ファミリー未選択'}
              </Text>
            </View>

            {/* Content input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                placeholder="今日の出来事や家族へのメッセージを書いてみましょう..."
                placeholderTextColor={colors.textLight}
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
                  { color: isOverLimit ? colors.error : colors.textLight },
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
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Layout.spacing.md,
    gap: Layout.spacing.xs,
  },
  familyName: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: Layout.spacing.sm,
  },
  textInput: {
    minHeight: 200,
    fontSize: Layout.fontSize.md,
    lineHeight: 24,
    padding: Layout.spacing.md,
    borderWidth: 1,
    borderRadius: Layout.borderRadius.md,
  },
  charCountContainer: {
    alignItems: 'flex-end',
    marginBottom: Layout.spacing.lg,
  },
  charCount: {
    fontSize: Layout.fontSize.sm,
  },
  tipsContainer: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  tipsTitle: {
    fontSize: Layout.fontSize.md,
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
    fontSize: Layout.fontSize.sm,
    flex: 1,
  },
});
