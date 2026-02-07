import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Share,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button } from '@components/ui/Button';
import { Loading } from '@components/ui/Loading';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import { invitationService } from '@services/firebase/invitation';
import type { InviteCode } from '@/src/types/family';

interface InviteCodeModalProps {
  visible: boolean;
  familyId: string;
  userId: string;
  onClose: () => void;
  existingCode?: InviteCode;
  onNewCode?: () => void;
}

export const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
  visible,
  familyId,
  userId,
  onClose,
  existingCode,
  onNewCode,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [inviteCode, setInviteCode] = useState<InviteCode | null>(existingCode || null);
  const [loading, setLoading] = useState(!existingCode);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    if (visible && !existingCode) {
      generateCode();
    }
  }, [visible, existingCode]);

  const generateCode = async () => {
    setLoading(true);
    try {
      const code = await invitationService.createInviteCode({
        familyId,
        createdBy: userId,
      });
      setInviteCode(code);
    } catch (error) {
      Alert.alert('エラー', '招待コードの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (inviteCode) {
      await Clipboard.setStringAsync(inviteCode.code);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handleShare = async () => {
    if (inviteCode) {
      try {
        await Share.share({
          message: `ファミリーに参加してください！\n招待コード: ${inviteCode.code}`,
        });
      } catch (error) {
        // User cancelled share
      }
    }
  };

  const handleDeactivate = async () => {
    if (!inviteCode) return;

    Alert.alert(
      '招待コードを無効化',
      'この招待コードを無効化しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '無効化',
          style: 'destructive',
          onPress: async () => {
            try {
              await invitationService.deactivateInviteCodeById(inviteCode.id);
              setInviteCode({ ...inviteCode, isActive: false });
            } catch (error) {
              Alert.alert('エラー', '無効化に失敗しました');
            }
          },
        },
      ]
    );
  };

  const formatExpiryDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>招待コード</Text>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Loading testID="loading-indicator" />
            </View>
          ) : inviteCode ? (
            <>
              <View style={[styles.codeContainer, { backgroundColor: colors.surface }]}>
                <Text style={[styles.code, { color: colors.text }]}>
                  {inviteCode.code}
                </Text>
              </View>

              <Text style={[styles.info, { color: colors.textSecondary }]}>
                有効期限: {formatExpiryDate(inviteCode.expiresAt)}
              </Text>

              <Text style={[styles.info, { color: colors.textSecondary }]}>
                使用回数: {inviteCode.usedCount} / {inviteCode.maxUses}
              </Text>

              {!inviteCode.isActive && (
                <Text style={[styles.inactive, { color: colors.error }]}>無効</Text>
              )}

              {copyFeedback && (
                <Text style={[styles.feedback, { color: colors.success }]}>
                  コピーしました
                </Text>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  title="コードをコピー"
                  onPress={handleCopy}
                  variant="primary"
                  style={styles.actionButton}
                />
                <Button
                  title="共有"
                  onPress={handleShare}
                  variant="outline"
                  style={styles.actionButton}
                />
              </View>

              {inviteCode.isActive && (
                <Button
                  title="無効化"
                  onPress={handleDeactivate}
                  variant="outline"
                  style={styles.deactivateButton}
                />
              )}

              {onNewCode && (
                <Button
                  title="新しいコードを生成"
                  onPress={onNewCode}
                  variant="ghost"
                  style={styles.newCodeButton}
                />
              )}
            </>
          ) : null}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button title="閉じる" onPress={onClose} variant="outline" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: Layout.spacing.lg,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeContainer: {
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    marginVertical: Layout.spacing.lg,
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  info: {
    fontSize: Layout.fontSize.md,
    marginTop: Layout.spacing.sm,
  },
  inactive: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginTop: Layout.spacing.md,
  },
  feedback: {
    fontSize: Layout.fontSize.md,
    marginTop: Layout.spacing.md,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    marginTop: Layout.spacing.xl,
    gap: Layout.spacing.md,
  },
  actionButton: {
    width: '100%',
  },
  deactivateButton: {
    width: '100%',
    marginTop: Layout.spacing.md,
  },
  newCodeButton: {
    width: '100%',
    marginTop: Layout.spacing.sm,
  },
  footer: {
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderTopWidth: 1,
  },
});
