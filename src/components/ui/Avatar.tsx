import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  testID?: string;
}

const getSize = (size: AvatarSize): number => {
  switch (size) {
    case 'sm':
      return 32;
    case 'md':
      return 44;
    case 'lg':
      return 64;
    case 'xl':
      return 96;
    default:
      return 44;
  }
};

const getFontSize = (size: AvatarSize): number => {
  switch (size) {
    case 'sm':
      return 14;
    case 'md':
      return 18;
    case 'lg':
      return 24;
    case 'xl':
      return 36;
    default:
      return 18;
  }
};

const getInitials = (name?: string): string => {
  if (!name) return '?';
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const dimension = getSize(size);
  const fontSize = getFontSize(size);

  if (source) {
    return (
      <Image
        testID={testID}
        source={{ uri: source }}
        style={[
          styles.image,
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.placeholder,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: colors.primary,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E0E0E0',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
