import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Loading } from '@components/ui/Loading';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import { invitationService } from '@services/firebase/invitation';

interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

interface JoinFamilyModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSuccess: (familyId: string) => void;
}

export const JoinFamilyModal: React.FC<JoinFamilyModalProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setCode('');
      setError(null);
    }
  }, [visible]);

  const handleCodeChange = (text: string) => {
    // Convert to uppercase and limit to 6 characters
    const upperCase = text.toUpperCase().slice(0, 6);
    setCode(upperCase);
    setError(null);
  };

  const handleJoin = async () => {
    // Validation
    if (code.length !== 6) {
      setError('招待コードは6文字です');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await invitationService.useInviteCode(
        code,
        user.uid,
        user.displayName || 'ユーザー',
        user.photoURL
      );

      if (result.success && result.familyId) {
        onSuccess(result.familyId);
        onClose();
      } else {
        setError(result.error || '無効な招待コードです');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファミリーへの参加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            ファミリーに参加
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            招待コードを入力してファミリーに参加しましょう
          </Text>

          <Input
            placeholder="招待コードを入力"
            value={code}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            maxLength={6}
            autoFocus
            error={error}
            editable={!loading}
          />

          {loading && (
            <View style={styles.loadingContainer}>
              <Loading testID="loading-indicator" />
            </View>
          )}
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="キャンセル"
            onPress={onClose}
            variant="outline"
            disabled={loading}
            style={styles.button}
          />
          <Button
            title="参加"
            onPress={handleJoin}
            loading={loading}
            disabled={loading || code.length !== 6}
            style={styles.button}
          />
        </View>
      </KeyboardAvoidingView>
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
  },
  description: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    marginBottom: Layout.spacing.lg,
  },
  loadingContainer: {
    marginTop: Layout.spacing.lg,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: Layout.spacing.md,
    paddingHorizontal: Layout.spacing.lg,
    borderTopWidth: 1,
    gap: Layout.spacing.md,
  },
  button: {
    flex: 1,
  },
});
