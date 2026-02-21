import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button, Input } from '@/src/components/ui';
import { GoogleSignInButton } from '@/src/components/auth/GoogleSignInButton';
import { useAuth } from '@/src/hooks/useAuth';
import { signUpSchema, SignUpFormData } from '@/src/utils/validation';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

export default function SignUpScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { signUp, signInWithGoogle, isLoading, error, clearError } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      clearError();
      await signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
      });
    } catch {
      Alert.alert('登録エラー', error || '登録に失敗しました');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      clearError();
      await signInWithGoogle();
    } catch {
      Alert.alert('登録エラー', error || 'Googleログインに失敗しました');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              新規登録
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              アカウントを作成して始めましょう
            </Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="名前"
                  placeholder="ニックネームを入力"
                  autoCapitalize="words"
                  leftIcon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                  testID="name-input"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="メールアドレス"
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  testID="email-input"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="パスワード"
                  placeholder="8文字以上、英数字を含む"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  testID="password-input"
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="パスワード（確認）"
                  placeholder="もう一度パスワードを入力"
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  testID="confirm-password-input"
                />
              )}
            />

            <Button
              title="登録する"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.submitButton}
              testID="signup-button"
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                または
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <GoogleSignInButton
              onPress={handleGoogleSignIn}
              loading={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              すでにアカウントをお持ちの方は
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: colors.primary }]}>
                  ログイン
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Layout.spacing.lg,
  },
  backButton: {
    width: Layout.minTapSize,
    height: Layout.minTapSize,
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  header: {
    marginBottom: Layout.spacing.xl,
  },
  title: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: Layout.spacing.sm,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
  },
  form: {
    marginBottom: Layout.spacing.xl,
  },
  submitButton: {
    marginTop: Layout.spacing.md,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: Layout.fontSize.sm,
    marginHorizontal: Layout.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  footerText: {
    fontSize: Layout.fontSize.sm,
  },
  loginLink: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
  },
});
