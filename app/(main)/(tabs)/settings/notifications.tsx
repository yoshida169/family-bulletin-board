import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { NotificationToggle } from '@/src/components/settings/NotificationToggle';
import { Button } from '@/src/components/ui/Button';
import { useNotificationSettings } from '@/src/hooks/useNotificationSettings';
import { useNotificationPermission } from '@/src/hooks/useNotificationPermission';
import { useFamilies } from '@/src/hooks/useFamilies';

/**
 * 通知設定画面
 */
export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { settings, isLoading, updateSettings, updateFamilySettings } =
    useNotificationSettings();
  const { permission, requestPermission } = useNotificationPermission();
  const { families } = useFamilies();

  const [isSaving, setIsSaving] = useState(false);

  // 通知権限をリクエスト
  const handleRequestPermission = async () => {
    try {
      const result = await requestPermission();

      if (!result.granted) {
        Alert.alert(
          '通知が無効です',
          'デバイスの設定から通知を有効にしてください。',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('エラー', '通知権限のリクエストに失敗しました。');
    }
  };

  // グローバル設定を更新
  const handleToggleGlobalSetting = async (
    key: keyof Omit<typeof settings, 'familySettings'>,
    value: boolean
  ) => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateSettings({ [key]: value });
    } catch (error) {
      Alert.alert('エラー', '設定の更新に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // ファミリー別設定を更新
  const handleToggleFamilySetting = async (familyId: string, value: boolean) => {
    setIsSaving(true);
    try {
      await updateFamilySettings(familyId, value);
    } catch (error) {
      Alert.alert('エラー', 'ファミリー通知設定の更新に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['left', 'right']}
      >
        <Stack.Screen
          options={{
            title: '通知設定',
            headerBackTitle: '戻る',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      <Stack.Screen
        options={{
          title: '通知設定',
          headerBackTitle: '戻る',
        }}
      />

      <ScrollView style={styles.scrollView}>
        {/* 通知権限状態 */}
        {permission && !permission.granted && (
          <View style={[styles.permissionBanner, { backgroundColor: colors.warning }]}>
            <Ionicons
              name="notifications-off-outline"
              size={24}
              color={colors.background}
            />
            <View style={styles.permissionTextContainer}>
              <Text style={[styles.permissionTitle, { color: colors.background }]}>
                通知が無効です
              </Text>
              <Text style={[styles.permissionMessage, { color: colors.background }]}>
                プッシュ通知を受け取るには、通知を有効にしてください。
              </Text>
            </View>
            <Button
              label="有効にする"
              onPress={handleRequestPermission}
              variant="secondary"
              size="small"
            />
          </View>
        )}

        {/* グローバル設定 */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            グローバル設定
          </Text>

          <NotificationToggle
            label="プッシュ通知"
            description="すべての通知を受け取るかどうか"
            value={settings.pushNotificationsEnabled}
            onValueChange={(value) =>
              handleToggleGlobalSetting('pushNotificationsEnabled', value)
            }
            disabled={isSaving || !permission?.granted}
          />

          <NotificationToggle
            label="新規投稿"
            description="新しい投稿が作成されたときに通知"
            value={settings.notifyOnNewPost}
            onValueChange={(value) => handleToggleGlobalSetting('notifyOnNewPost', value)}
            disabled={isSaving || !permission?.granted || !settings.pushNotificationsEnabled}
          />

          <NotificationToggle
            label="新規コメント"
            description="自分の投稿にコメントがついたときに通知"
            value={settings.notifyOnComment}
            onValueChange={(value) => handleToggleGlobalSetting('notifyOnComment', value)}
            disabled={isSaving || !permission?.granted || !settings.pushNotificationsEnabled}
          />

          <NotificationToggle
            label="メンション"
            description="自分がメンションされたときに通知"
            value={settings.notifyOnMention}
            onValueChange={(value) => handleToggleGlobalSetting('notifyOnMention', value)}
            disabled={isSaving || !permission?.granted || !settings.pushNotificationsEnabled}
          />
        </View>

        {/* ファミリー別設定 */}
        {families && families.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              ファミリー別設定
            </Text>

            {families.map((family) => {
              const familySetting = settings.familySettings[family.id];
              const isEnabled = familySetting?.enabled ?? true;

              return (
                <NotificationToggle
                  key={family.id}
                  label={family.name}
                  description={`${family.name}からの通知を受け取る`}
                  value={isEnabled}
                  onValueChange={(value) => handleToggleFamilySetting(family.id, value)}
                  disabled={
                    isSaving || !permission?.granted || !settings.pushNotificationsEnabled
                  }
                />
              );
            })}
          </View>
        )}

        {/* 説明 */}
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            ファミリー別設定は、グローバル設定が有効な場合にのみ機能します。
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.spacing.lg,
    margin: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  permissionTextContainer: {
    flex: 1,
    marginHorizontal: Layout.spacing.md,
  },
  permissionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  permissionMessage: {
    fontSize: Layout.fontSize.sm,
  },
  section: {
    marginTop: Layout.spacing.md,
    marginHorizontal: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
    paddingBottom: Layout.spacing.sm,
  },
  infoContainer: {
    padding: Layout.spacing.lg,
    marginHorizontal: Layout.spacing.md,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
