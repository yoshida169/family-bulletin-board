import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
  testID?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message,
  fullScreen = false,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: fullScreen ? colors.background : 'transparent' },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: Layout.spacing.md,
    fontSize: Layout.fontSize.md,
  },
});
