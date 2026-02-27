import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import { boardService } from '@services/firebase/board';
import type { Board } from '@/src/types/post';

interface CreateBoardModalProps {
  visible: boolean;
  familyId: string;
  userId: string;
  onClose: () => void;
  onSuccess: (board: Board) => void;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  visible,
  familyId,
  userId,
  onClose,
  onSuccess,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setName('');
      setDescription('');
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setError('掲示板名を入力してください');
      return;
    }

    if (name.length > 50) {
      setError('掲示板名は50文字以内で入力してください');
      return;
    }

    if (description.length > 200) {
      setError('説明は200文字以内で入力してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const board = await boardService.createBoard({
        name: name.trim(),
        description: description.trim() || undefined,
        familyId,
        createdBy: userId,
      });

      onSuccess(board);
      onClose();
    } catch (err) {
      console.error('Failed to create board:', err);
      setError('掲示板の作成に失敗しました');
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
          <Pressable onPress={onClose} disabled={loading}>
            <Text style={[styles.headerButton, { color: colors.primary }]}>
              キャンセル
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            掲示板を作成
          </Text>
          <View style={styles.headerButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              掲示板名 <Text style={styles.required}>*</Text>
            </Text>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="例: 家族の連絡"
              maxLength={50}
              autoFocus
              testID="board-name-input"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              説明（任意）
            </Text>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="掲示板の説明を入力"
              multiline
              numberOfLines={3}
              maxLength={200}
              testID="board-description-input"
            />
            <Text style={[styles.helper, { color: colors.textSecondary }]}>
              {description.length}/200
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          <Button
            label="作成"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
            testID="create-board-button"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 80,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Layout.spacing.md,
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  required: {
    color: '#FF3B30',
  },
  helper: {
    fontSize: 12,
    marginTop: Layout.spacing.xs,
    textAlign: 'right',
  },
  errorContainer: {
    marginBottom: Layout.spacing.md,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
