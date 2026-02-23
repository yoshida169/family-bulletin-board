import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { Avatar, Button, Card } from '@/src/components/ui';
import { useAuth } from '@/src/hooks/useAuth';
import { authService } from '@/src/services/firebase/auth';
import { storageService } from '@/src/services/firebase/storage';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

export default function ProfileEditScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState<string | null>(user?.photoURL || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('権限エラー', '写真ライブラリへのアクセスを許可してください');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        try {
          const imageUri = result.assets[0].uri;
          const uploadedUrl = await storageService.uploadUserProfile(
            user!.uid,
            imageUri
          );
          setPhotoURL(uploadedUrl);
        } catch (error) {
          Alert.alert('エラー', '画像のアップロードに失敗しました');
          console.error('Image upload error:', error);
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      Alert.alert('エラー', '画像の選択に失敗しました');
      console.error('Image picker error:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }

    try {
      setIsLoading(true);
      await authService.updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        photoURL: photoURL,
      });
      Alert.alert('成功', 'プロフィールを更新しました', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('エラー', 'プロフィールの更新に失敗しました');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
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
          プロフィール編集
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.avatarCard}>
          <View style={styles.avatarContainer}>
            <Avatar
              source={photoURL}
              name={displayName || user?.displayName}
              size="xl"
            />
            <TouchableOpacity
              style={[styles.avatarButton, { backgroundColor: colors.primary }]}
              onPress={handlePickImage}
              disabled={isUploadingImage}
              activeOpacity={0.7}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons
                  name="camera"
                  size={20}
                  color={colors.background}
                />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            タップして写真を変更
          </Text>
        </Card>

        <Card style={styles.formCard}>
          <Text style={[styles.label, { color: colors.text }]}>表示名</Text>
          <View
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="山田太郎"
              placeholderTextColor={colors.textLight}
              style={[styles.inputText, { color: colors.text }]}
              maxLength={50}
            />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>メール</Text>
          <View
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.inputText, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
          <Text style={[styles.hint, { color: colors.textLight }]}>
            メールアドレスは変更できません
          </Text>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="保存"
            onPress={handleSave}
            disabled={isLoading || isUploadingImage}
            loading={isLoading}
            variant="primary"
          />
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
  avatarCard: {
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Layout.spacing.sm,
  },
  avatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarHint: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.sm,
  },
  formCard: {
    marginBottom: Layout.spacing.lg,
  },
  label: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: Layout.fontSize.md,
  },
  hint: {
    fontSize: Layout.fontSize.sm,
    marginTop: -Layout.spacing.sm,
    marginBottom: Layout.spacing.md,
  },
  buttonContainer: {
    marginTop: Layout.spacing.lg,
  },
});
