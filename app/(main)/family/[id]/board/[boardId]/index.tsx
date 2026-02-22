import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Loading } from '@/src/components/ui';
import { PinnedPostSection } from '@/src/components/board/PinnedPostSection';
import { UnreadBadge } from '@/src/components/board/UnreadBadge';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { boardService } from '@/src/services/firebase/board';
import { postService } from '@/src/services/firebase/post';
import { useAuthStore } from '@/src/store/authStore';
import type { Board, Post } from '@/src/types/post';

export default function BoardDetailScreen() {
  const router = useRouter();
  const { id: familyId, boardId } = useLocalSearchParams<{
    id: string;
    boardId: string;
  }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // ピン留め投稿と通常の投稿を分離
  const pinnedPosts = posts.filter((post) => post.isPinned);
  const regularPosts = posts.filter((post) => !post.isPinned);

  useEffect(() => {
    if (familyId && boardId) {
      loadBoardData();
    }
  }, [familyId, boardId]);

  useEffect(() => {
    if (!familyId || !boardId) return;

    // Subscribe to posts in realtime
    const unsubscribe = postService.subscribeToBoardPosts(
      familyId,
      boardId,
      (updatedPosts) => {
        setPosts(updatedPosts);
      }
    );

    return () => unsubscribe();
  }, [familyId, boardId]);

  const loadBoardData = async () => {
    if (!familyId || !boardId || !user) return;

    try {
      setLoading(true);
      const boardData = await boardService.getBoard(familyId, boardId);
      const postsData = await postService.getBoardPosts(familyId, boardId);
      const unreadCountData = await postService.getUnreadCount(
        familyId,
        boardId,
        user.uid
      );

      setBoard(boardData);
      setPosts(postsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Failed to load board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBoardData();
    setRefreshing(false);
  };

  const handleCreatePost = () => {
    router.push({
      pathname: '/post/create',
      params: { familyId, boardId },
    });
  };

  const handlePostPress = (post: Post) => {
    router.push(
      `/family/${familyId}/board/${boardId}/post/${post.id}`
    );
  };

  if (loading || !board) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Loading />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[styles.boardName, { color: colors.text }]}>
              {board.name}
            </Text>
            {unreadCount > 0 && (
              <UnreadBadge count={unreadCount} style={styles.unreadBadge} />
            )}
          </View>
          {board.description && (
            <Text
              style={[styles.boardDescription, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {board.description}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push(`/family/${familyId}/board/${boardId}/search`)
          }
          style={styles.searchButton}
        >
          <Ionicons name="search" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCreatePost}
          style={styles.createButton}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      <FlatList
        data={regularPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            {pinnedPosts.length > 0 && (
              <PinnedPostSection
                posts={pinnedPosts}
                onPressPost={handlePostPress}
              />
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePostPress(item)}
            style={[styles.postCard, { backgroundColor: colors.surface }]}
          >
            <View style={styles.postHeader}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {item.authorName}
              </Text>
              <Text style={[styles.postDate, { color: colors.textSecondary }]}>
                {item.createdAt.toLocaleDateString('ja-JP')}
              </Text>
            </View>
            <Text
              style={[styles.postContent, { color: colors.text }]}
              numberOfLines={3}
            >
              {item.content}
            </Text>
            {item.imageUrls.length > 0 && (
              <View style={styles.postFooter}>
                <Ionicons
                  name="image"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.imageCount, { color: colors.textSecondary }]}
                >
                  {item.imageUrls.length}枚の画像
                </Text>
              </View>
            )}
            {item.commentCount > 0 && (
              <View style={styles.postFooter}>
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.commentCount, { color: colors.textSecondary }]}
                >
                  {item.commentCount}件のコメント
                </Text>
              </View>
            )}
            {item.isPinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={16} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              まだ投稿がありません
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              右上の＋ボタンから投稿を作成できます
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
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
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: Layout.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  boardName: {
    fontSize: 17,
    fontWeight: '600',
  },
  unreadBadge: {
    marginLeft: Layout.spacing.xs,
  },
  boardDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  searchButton: {
    padding: Layout.spacing.xs,
  },
  createButton: {
    padding: Layout.spacing.xs,
  },
  listContent: {
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  postCard: {
    padding: Layout.spacing.md,
    borderRadius: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: Layout.spacing.sm,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  imageCount: {
    fontSize: 12,
    marginLeft: Layout.spacing.xs,
  },
  commentCount: {
    fontSize: 12,
    marginLeft: Layout.spacing.xs,
  },
  pinnedBadge: {
    position: 'absolute',
    top: Layout.spacing.md,
    right: Layout.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: Layout.spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
  },
});
