import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Card } from '@components/ui/Card';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import type { Board } from '@/src/types/post';

interface BoardCardProps {
  board: Board;
  onPress?: () => void;
  unreadCount?: number;
  testID?: string;
}

export const BoardCard: React.FC<BoardCardProps> = ({
  board,
  onPress,
  unreadCount = 0,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const hasUnread = unreadCount > 0;

  return (
    <Card onPress={onPress} testID={testID}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <View style={[styles.icon, { backgroundColor: colors.primary }]}>
            <Text style={styles.iconText}>📋</Text>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {board.name}
            </Text>
            {hasUnread && (
              <View
                style={[styles.badge, { backgroundColor: colors.error }]}
              >
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          {board.description && (
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {board.description}
            </Text>
          )}
          <View style={styles.footer}>
            <Text style={[styles.postCount, { color: colors.textSecondary }]}>
              {board.postCount}件の投稿
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: Layout.spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.xs,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: Layout.spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    marginBottom: Layout.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postCount: {
    fontSize: 12,
  },
});
