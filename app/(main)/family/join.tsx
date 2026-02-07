import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Input } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { invitationService } from '@/src/services/firebase/invitation';
import { useAuthStore } from '@/src/store/authStore';

export default function JoinFamilyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async () => {
    if (!user) {
      Alert.alert('エラー', 'ユーザー情報が取得できませんでした');
      return;
    }

    if (!code.trim()) {
      setError('招待コードを入力してください');
      return;
    }

    if (code.trim().length !== 6) {
      setError('招待コードは6桁です');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await invitationService.useInviteCode(
        code.trim().toUpperCase(),
        user.uid,
        user.displayName ?? 'ユーザー',
        user.photoURL ?? null
      );

      if (result.success) {
        Alert.alert(
          '参加完了',
          'ファミリーに参加しました',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        setError(result.error ?? 'ファミリーへの参加に失敗しました');
      }
    } catch (error) {
      console.error('Error joining family:', error);
      setError('ファミリーへの参加に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    // Only allow alphanumeric characters and convert to uppercase
    const sanitized = text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (sanitized.length <= 6) {
      setCode(sanitized);
      setError('');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>
          ファミリーに参加
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          招待コードを入力してファミリーに参加します
        </Text>

        <View style={styles.form}>
          <Input
            label="招待コード"
            placeholder="ABC123"
            value={code}
            onChangeText={handleCodeChange}
            error={error}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            testID="invite-code-input"
          />

          <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 招待コードは6桁の英数字です
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              💡 ファミリーの管理者から招待コードを受け取ってください
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title="参加"
          onPress={handleJoin}
          loading={isLoading}
          disabled={isLoading || code.length !== 6}
          testID="join-family-button"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
    marginBottom: Layout.spacing.xl,
  },
  form: {
    gap: Layout.spacing.lg,
  },
  infoBox: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.sm,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
  footer: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
});
