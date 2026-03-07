import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import type { Post, Comment } from '@/types/post';

interface SearchResultItem {
  type: 'post' | 'comment';
  post?: Post;
  comment?: Comment;
  parentPost?: Post;
}

interface SearchResultListProps {
  results: SearchResultItem[];
  keyword: string;
  familyId: string;
  boardId: string;
  emptyMessage?: string;
}

export function SearchResultList({
  results,
  keyword,
  familyId,
  boardId,
  emptyMessage = '検索結果が見つかりませんでした',
}: SearchResultListProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleResultPress = (item: SearchResultItem) => {
    if (item.type === 'post' && item.post) {
      router.push(`/family/${familyId}/board/${boardId}/post/${item.post.id}`);
    } else if (item.type === 'comment' && item.comment && item.parentPost) {
      router.push(
        `/family/${familyId}/board/${boardId}/post/${item.parentPost.id}`
      );
    }
  };

  const highlightKeyword = (text: string, keyword: string): string => {
    if (!keyword.trim()) return text;

    // For display purposes, we'll show the text as-is
    // In a real app, you might want to use a more sophisticated highlighting approach
    return text;
  };

  const renderResultItem = ({ item }: { item: SearchResultItem }) => {
    const isPost = item.type === 'post';
    const content = isPost ? item.post?.content : item.comment?.content;
    const authorName = isPost ? item.post?.authorName : item.comment?.authorName;
    const createdAt = isPost ? item.post?.createdAt : item.comment?.createdAt;

    if (!content || !authorName || !createdAt) return null;

    return (
      <TouchableOpacity
        onPress={() => handleResultPress(item)}
        style={[styles.resultItem, { backgroundColor: colors.surface }]}
      >
        <View style={styles.resultHeader}>
          <View style={styles.typeIndicator}>
            <Ionicons
              name={isPost ? 'document-text' : 'chatbubble'}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.typeText, { color: colors.primary }]}>
              {isPost ? '投稿' : 'コメント'}
            </Text>
          </View>
          <Text style={[styles.resultDate, { color: colors.textSecondary }]}>
            {createdAt.toLocaleDateString('ja-JP')}
          </Text>
        </View>

        <Text style={[styles.authorName, { color: colors.text }]}>
          {authorName}
        </Text>

        <Text
          style={[styles.resultContent, { color: colors.text }]}
          numberOfLines={3}
        >
          {highlightKeyword(content, keyword)}
        </Text>

        {!isPost && item.parentPost && (
          <View style={styles.parentPostInfo}>
            <Ionicons
              name="arrow-forward"
              size={12}
              color={colors.textSecondary}
            />
            <Text
              style={[styles.parentPostText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              投稿: {item.parentPost.content.substring(0, 30)}
              {item.parentPost.content.length > 30 ? '...' : ''}
            </Text>
          </View>
        )}

        {isPost && item.post && item.post.imageUrls.length > 0 && (
          <View style={styles.metaInfo}>
            <Ionicons name="image" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.post.imageUrls.length}枚の画像
            </Text>
          </View>
        )}

        {isPost && item.post && item.post.commentCount > 0 && (
          <View style={styles.metaInfo}>
            <Ionicons
              name="chatbubble-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {item.post.commentCount}件のコメント
            </Text>
          </View>
        )}

        {isPost && item.post?.isPinned && (
          <View style={styles.pinnedBadge}>
            <Ionicons name="pin" size={14} color={colors.primary} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={results}
      keyExtractor={(item, index) =>
        item.type === 'post'
          ? `post-${item.post?.id}-${index}`
          : `comment-${item.comment?.id}-${index}`
      }
      renderItem={renderResultItem}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Ionicons
            name="search-outline"
            size={48}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {emptyMessage}
          </Text>
          {keyword && (
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              キーワード: "{keyword}"
            </Text>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
  },
  resultItem: {
    padding: Layout.spacing.md,
    borderRadius: 12,
    position: 'relative',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultDate: {
    fontSize: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Layout.spacing.xs,
  },
  resultContent: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: Layout.spacing.sm,
  },
  parentPostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  parentPostText: {
    fontSize: 12,
    flex: 1,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.xs,
    marginTop: Layout.spacing.xs,
  },
  metaText: {
    fontSize: 12,
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
    paddingVertical: Layout.spacing.xl * 3,
  },
  emptyText: {
    fontSize: 16,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
  },
});
