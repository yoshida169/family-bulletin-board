import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Card } from '@/src/components/ui';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/firebase/auth';
import { memberService } from '@/src/services/firebase/member';
import { useFamilyStore } from '@/src/store/familyStore';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

export default function AccountScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();
  const { currentFamilyId } = useFamilyStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleLeaveFamily = () => {
    if (!currentFamilyId || !user) return;

    Alert.alert(
      'ファミリーから退会',
      'ファミリーから退会すると、あなたの投稿とコメントは全て削除されます。この操作は取り消せません。本当に退会しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '退会する',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await memberService.leaveFamily(currentFamilyId, user.uid);
              Alert.alert('退会完了', 'ファミリーから退会しました', [
                { text: 'OK', onPress: () => router.replace('/(main)/(tabs)/family') },
              ]);
            } catch (error: any) {
              Alert.alert('エラー', error.message || 'ファミリーからの退会に失敗しました');
              console.error('Leave family error:', error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    if (!user) return;

    Alert.alert(
      'アカウントを削除',
      'アカウントを削除すると、30日後に完全に削除されます。この期間中は再ログインすることで削除をキャンセルできます。本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      '最終確認',
      'この操作は取り消せません。全てのデータが30日後に削除されます。本当によろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              if (user) {
                await authService.deleteAccount(user.uid);
              }
              Alert.alert(
                'アカウント削除',
                'アカウントの削除処理が完了しました。30日後に完全に削除されます。',
                [{ text: 'OK' }]
              );
            } catch (error: any) {
              Alert.alert('エラー', error.message || 'アカウントの削除に失敗しました');
              console.error('Delete account error:', error);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          アカウント
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            アカウント情報
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              メール
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.email}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              表示名
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.displayName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
              登録日
            </Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {user?.createdAt?.toLocaleDateString('ja-JP')}
            </Text>
          </View>
        </Card>

        {currentFamilyId && (
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ファミリー設定
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              現在のファミリーから退会できます。退会すると、あなたの投稿とコメントは全て削除されます。
            </Text>
            <Button
              title="ファミリーから退会"
              onPress={handleLeaveFamily}
              disabled={isLoading}
              variant="outline"
            />
          </Card>
        )}

        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.error }]}>
            危険な操作
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            アカウントを削除すると、全てのデータが30日後に完全に削除されます。この期間中は再ログインすることで削除をキャンセルできます。
          </Text>
          <Button
            title="アカウントを削除"
            onPress={handleDeleteAccount}
            disabled={isLoading}
            variant="outline"
          />
        </Card>

        <View style={styles.warningBox}>
          <Ionicons
            name="warning-outline"
            size={20}
            color={colors.warning}
            style={styles.warningIcon}
          />
          <Text style={[styles.warningText, { color: colors.textSecondary }]}>
            削除されたデータは復元できません。十分にご注意ください。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  headerRight: {
    width: 44,
  },
  scrollContent: {
    padding: Layout.spacing.md,
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginBottom: Layout.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: Layout.fontSize.md,
  },
  infoValue: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
  description: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
    marginBottom: Layout.spacing.md,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.md,
    marginTop: Layout.spacing.lg,
  },
  warningIcon: {
    marginRight: Layout.spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
  },
});
