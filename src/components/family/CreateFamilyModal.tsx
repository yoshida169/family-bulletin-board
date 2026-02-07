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
} from 'react-native';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { RelationPicker } from './RelationPicker';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import { useFamilyStore } from '@store/familyStore';
import type { Relation } from '@/src/types/family';

interface User {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
}

interface CreateFamilyModalProps {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateFamilyModal: React.FC<CreateFamilyModalProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { createFamily } = useFamilyStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [relation, setRelation] = useState<Relation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setName('');
      setDescription('');
      setRelation(null);
      setError(null);
    }
  }, [visible]);

  const handleCreate = async () => {
    // Validation
    if (!name.trim()) {
      setError('ファミリー名を入力してください');
      return;
    }

    if (name.length > 50) {
      setError('ファミリー名は50文字以内で入力してください');
      return;
    }

    if (!relation) {
      setError('続柄を選択してください');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createFamily({
        name: name.trim(),
        description: description.trim() || null,
        ownerId: user.uid,
        ownerName: user.displayName || 'ユーザー',
        ownerRelation: relation,
        ownerPhotoURL: user.photoURL,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファミリーの作成に失敗しました');
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
            ファミリーを作成
          </Text>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Input
            placeholder="ファミリー名"
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoFocus
          />

          <Input
            placeholder="説明（任意）"
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            multiline
            numberOfLines={3}
          />

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>
              あなたの続柄
            </Text>
            <RelationPicker value={relation} onSelect={setRelation} />
          </View>

          {error && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="キャンセル"
            onPress={onClose}
            variant="outline"
            disabled={loading}
            style={styles.button}
          />
          <Button
            title="作成"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
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
  },
  contentContainer: {
    padding: Layout.spacing.lg,
  },
  section: {
    marginTop: Layout.spacing.md,
  },
  label: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  errorText: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
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
