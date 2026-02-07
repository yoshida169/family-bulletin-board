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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { RELATIONS } from '@/src/constants/relations';
import { createFamilySchema, CreateFamilyFormData } from '@/src/utils/validation';
import { familyService } from '@/src/services/firebase/family';
import { useAuthStore } from '@/src/store/authStore';
import { Relation } from '@/src/types/family';

export default function CreateFamilyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateFamilyFormData>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      name: '',
      description: '',
      relation: '',
    },
  });

  const onSubmit = async (data: CreateFamilyFormData) => {
    if (!user) {
      Alert.alert('エラー', 'ユーザー情報が取得できませんでした');
      return;
    }

    setIsLoading(true);
    try {
      await familyService.createFamily({
        name: data.name,
        description: data.description || null,
        ownerId: user.uid,
        ownerName: user.displayName ?? 'ユーザー',
        ownerRelation: data.relation as Relation,
        ownerPhotoURL: user.photoURL ?? null,
      });

      Alert.alert(
        '作成完了',
        'ファミリーを作成しました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating family:', error);
      Alert.alert('エラー', 'ファミリーの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelationSelect = (relation: Relation) => {
    setSelectedRelation(relation);
    setValue('relation', relation, { shouldValidate: true });
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
          新しいファミリーを作成
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          家族で共有する掲示板を作成します
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

          <View style={styles.relationContainer}>
            <Text style={[styles.label, { color: colors.text }]}>
              あなたの続柄
            </Text>
            <View style={styles.relationGrid}>
              {RELATIONS.map((relation) => (
                <TouchableOpacity
                  key={relation.value}
                  style={[
                    styles.relationButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor:
                        selectedRelation === relation.value
                          ? colors.primary
                          : colors.border,
                      borderWidth: selectedRelation === relation.value ? 2 : 1,
                    },
                  ]}
                  onPress={() => handleRelationSelect(relation.value)}
                  testID={`relation-${relation.value}`}
                >
                  <Text style={styles.relationEmoji}>{relation.emoji}</Text>
                  <Text
                    style={[
                      styles.relationLabel,
                      {
                        color:
                          selectedRelation === relation.value
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                  >
                    {relation.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.relation && (
              <Text style={[styles.error, { color: colors.error }]}>
                {errors.relation.message}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background }]}>
        <Button
          title="作成"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          testID="create-family-button"
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
    gap: Layout.spacing.md,
  },
  label: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    marginBottom: Layout.spacing.xs,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  relationContainer: {
    marginTop: Layout.spacing.sm,
  },
  relationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },
  relationButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.sm,
  },
  relationEmoji: {
    fontSize: 32,
    marginBottom: Layout.spacing.xs,
  },
  relationLabel: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
  error: {
    fontSize: Layout.fontSize.xs,
    marginTop: Layout.spacing.xs,
  },
  footer: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
});
