import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { Colors } from '@constants/colors';

interface UnreadBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const UnreadBadge: React.FC<UnreadBadgeProps> = ({
  count,
  size = 'medium',
  style,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // 未読数が0の場合は表示しない
  if (count <= 0) {
    return null;
  }

  // 99を超える場合は"99+"と表示
  const displayCount = count > 99 ? '99+' : count.toString();

  const sizeStyles = {
    small: styles.containerSmall,
    medium: styles.containerMedium,
    large: styles.containerLarge,
  };

  const textSizeStyles = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        sizeStyles[size],
        {
          backgroundColor: colors.error,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          textSizeStyles[size],
          {
            color: colors.onError,
          },
        ]}
        numberOfLines={1}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
    minWidth: 20,
    paddingHorizontal: 6,
  },
  containerSmall: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
  },
  containerMedium: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
  },
  containerLarge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
});
