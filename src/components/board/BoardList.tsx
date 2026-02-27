import React from 'react';
import { FlatList, StyleSheet, View, Text, useColorScheme } from 'react-native';
import { BoardCard } from './BoardCard';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import type { Board } from '@/src/types/post';

interface BoardListProps {
  boards: Board[];
  onBoardPress: (board: Board) => void;
  getUnreadCount?: (boardId: string) => number;
  emptyMessage?: string;
  testID?: string;
}

export const BoardList: React.FC<BoardListProps> = ({
  boards,
  onBoardPress,
  getUnreadCount,
  emptyMessage = '掲示板がありません',
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (boards.length === 0) {
    return (
      <View style={styles.emptyContainer} testID={`${testID}-empty`}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {emptyMessage}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={boards}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <BoardCard
          board={item}
          onPress={() => onBoardPress(item)}
          unreadCount={getUnreadCount ? getUnreadCount(item.id) : 0}
          testID={`${testID}-board-${item.id}`}
        />
      )}
      contentContainerStyle={styles.listContent}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
