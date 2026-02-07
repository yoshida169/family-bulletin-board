import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input, Loading } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { updateFamilySchema, UpdateFamilyFormData } from '@/src/utils/validation';
import { useFamilyStore } from '@/src/store/familyStore';
import { useAuthStore } from '@/src/store/authStore';

export default function EditFamilyScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const {
    currentFamily,
    setCurrentFamily,
    updateFamily,
    deleteFamily,
  } = useFamilyStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateFamilyFormData>({
    resolver: zodResolver(updateFamilySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (id) {
      setCurrentFamily(id);
    }
  }, [id, setCurrentFamily]);

  useEffect(() => {
    if (currentFamily) {
      reset({
        name: currentFamily.name,
        description: currentFamily.description || '',
      });
    }
  }, [currentFamily, reset]);

  if (!currentFamily) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Loading />
      </SafeAreaView>
    );
  }

  const isOwner = currentFamily.ownerId === user?.uid;
  const isAdmin = currentFamily.adminIds.includes(user?.uid ?? '');

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            編集権限がありません
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const onSubmit = async (data: UpdateFamilyFormData) => {
    if (!id) return;

    setIsLoading(true);
    try {
      await updateFamily(id, {
        name: data.name,
        description: data.description || null,
      });

      Alert.alert(
        '更新完了',
        'ファミリー情報を更新しました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating family:', error);
      Alert.alert('エラー', 'ファミリー情報の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      'ファミリーを削除',
      'このファミリーを削除してもよろしいですか？この操作は取り消せません。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteFamily(id);
              Alert.alert(
                '削除完了',
                'ファミリーを削除しました',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)/family'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting family:', error);
              Alert.alert('エラー', 'ファミリーの削除に失敗しました');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
          ファミリー情報を編集
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="ファミリー名"
                placeholder="例: 田中家"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
                autoCapitalize="none"
                testID="family-name-input"
              />
            )}
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="説明（任意）"
                placeholder="例: 田中家の掲示板"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                multiline
                numberOfLines={3}
                style={styles.descriptionInput}
                testID="family-description-input"
              />
            )}
          />
        </View>

        {isOwner && (
          <View style={styles.dangerZone}>
            <Text style={[styles.dangerZoneTitle, { color: colors.error }]}>
              危険な操作
            </Text>
            <Text style={[styles.dangerZoneText, { color: colors.textSecondary }]}>
              ファミリーを削除すると、すべての投稿とデータが完全に削除されます。この操作は取り消せません。
            </Text>
            <Button
              title="ファミリーを削除"
              onPress={handleDelete}
              variant="outline"
              loading={isDeleting}
              disabled={isDeleting || isLoading}
              style={[styles.deleteButton, { borderColor: colors.error }]}
              textStyle={{ color: colors.error }}
              testID="delete-family-button"
            />
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title="更新"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading || isDeleting}
          testID="update-family-button"
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
    marginBottom: Layout.spacing.xl,
  },
  form: {
    gap: Layout.spacing.md,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dangerZone: {
    marginTop: Layout.spacing.xl,
    padding: Layout.spacing.lg,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: '#fee',
    backgroundColor: '#fff5f5',
  },
  dangerZoneTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  dangerZoneText: {
    fontSize: Layout.fontSize.sm,
    marginBottom: Layout.spacing.md,
    lineHeight: 20,
  },
  deleteButton: {
    marginTop: Layout.spacing.sm,
  },
  footer: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
});
