import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { invitationService } from '@/src/services/firebase/invitation';
import { useAuthStore } from '@/src/store/authStore';
import { InviteCode } from '@/src/types/family';

export default function InviteFamilyScreen() {
  const { id: familyId } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadInviteCodes = useCallback(async () => {
    if (!familyId) return;

    setIsLoading(true);
    try {
      const codes = await invitationService.getActiveFamilyInviteCodes(familyId);
      setInviteCodes(codes);
    } catch (error) {
      console.error('Error loading invite codes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    loadInviteCodes();
  }, [loadInviteCodes]);

  const handleCreateCode = async () => {
    if (!user || !familyId) return;

    setIsCreating(true);
    try {
      await invitationService.createInviteCode({
        familyId,
        createdBy: user.uid,
      });

      await loadInviteCodes();
      Alert.alert('成功', '招待コードを作成しました');
    } catch (error) {
      console.error('Error creating invite code:', error);
      Alert.alert('エラー', '招待コードの作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    Clipboard.setString(code);
    Alert.alert('コピー完了', '招待コードをコピーしました');
  };

  const handleShareCode = async (code: string) => {
    try {
      await Share.share({
        message: `家族の掲示板に招待します！\n\n招待コード: ${code}\n\nアプリをダウンロードして、このコードを入力してください。`,
      });
    } catch (error) {
      console.error('Error sharing code:', error);
    }
  };

  const handleDeactivateCode = async (inviteCodeId: string, code: string) => {
    Alert.alert(
      '招待コードを無効化',
      `招待コード「${code}」を無効化しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '無効化',
          style: 'destructive',
          onPress: async () => {
            try {
              await invitationService.deactivateInviteCode(inviteCodeId);
              await loadInviteCodes();
              Alert.alert('成功', '招待コードを無効化しました');
            } catch (error) {
              console.error('Error deactivating code:', error);
              Alert.alert('エラー', '招待コードの無効化に失敗しました');
            }
          },
        },
      ]
    );
  };

  const formatExpiryDate = (date: Date): string => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return '期限切れ';
    if (diffDays === 0) return '今日まで';
    if (diffDays === 1) return '明日まで';
    return `あと${diffDays}日`;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.title, { color: colors.text }]}>
          ファミリーに招待
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          招待コードを作成して、家族を招待しましょう
        </Text>

        <View style={styles.createSection}>
          <Button
            title="新しい招待コードを作成"
            onPress={handleCreateCode}
            loading={isCreating}
            disabled={isCreating}
            testID="create-invite-code-button"
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              読み込み中...
            </Text>
          </View>
        ) : inviteCodes.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
            <Ionicons name="ticket-outline" size={48} color={colors.textLight} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              招待コードがありません
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textLight }]}>
              「新しい招待コードを作成」ボタンから作成してください
            </Text>
          </View>
        ) : (
          <View style={styles.codeList}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              有効な招待コード
            </Text>
            {inviteCodes.map((inviteCode) => (
              <View
                key={inviteCode.id}
                style={[styles.codeCard, { backgroundColor: colors.surface }]}
              >
                <View style={styles.codeHeader}>
                  <Text style={[styles.code, { color: colors.text }]}>
                    {inviteCode.code}
                  </Text>
                  <View style={styles.codeActions}>
                    <TouchableOpacity
                      onPress={() => handleCopyCode(inviteCode.code)}
                      style={[styles.iconButton, { backgroundColor: colors.background }]}
                      testID={`copy-code-${inviteCode.code}`}
                    >
                      <Ionicons name="copy-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleShareCode(inviteCode.code)}
                      style={[styles.iconButton, { backgroundColor: colors.background }]}
                      testID={`share-code-${inviteCode.code}`}
                    >
                      <Ionicons name="share-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.codeInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      有効期限: {formatExpiryDate(inviteCode.expiresAt)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                      使用回数: {inviteCode.usedCount} / {inviteCode.maxUses}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => handleDeactivateCode(inviteCode.id, inviteCode.code)}
                  style={styles.deactivateButton}
                  testID={`deactivate-code-${inviteCode.code}`}
                >
                  <Text style={[styles.deactivateText, { color: colors.error }]}>
                    無効化
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            💡 招待コードについて
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • 招待コードは6桁の英数字です
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • 有効期限は作成から7日間です
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • 1つのコードで1人が参加できます
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • 使用済みまたは期限切れのコードは使用できません
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
    marginBottom: Layout.spacing.lg,
  },
  createSection: {
    marginBottom: Layout.spacing.xl,
  },
  loadingContainer: {
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Layout.fontSize.md,
  },
  emptyContainer: {
    padding: Layout.spacing.xl,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: Layout.fontSize.sm,
    textAlign: 'center',
  },
  codeList: {
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  codeCard: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.sm,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  code: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  codeActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInfo: {
    gap: Layout.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
  },
  deactivateButton: {
    marginTop: Layout.spacing.xs,
    alignSelf: 'flex-start',
  },
  deactivateText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  infoBox: {
    padding: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Layout.spacing.xs,
  },
  infoTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
});
