import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  loading = false,
  disabled = false,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel="Googleでログイン"
      testID="google-signin-button"
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
          </View>
          <Text style={[styles.text, { color: colors.text }]}>
            Googleでログイン
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: Layout.buttonHeight,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Layout.spacing.md,
    marginVertical: Layout.spacing.xs,
  },
  iconContainer: {
    marginRight: Layout.spacing.sm,
  },
  text: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
