import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { SearchResultList } from '@/components/board/SearchResultList';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { postService } from '@/services/firebase/post';
import { commentService } from '@/services/firebase/comment';
import type { Post, Comment } from '@/types/post';

interface SearchResultItem {
  type: 'post' | 'comment';
  post?: Post;
  comment?: Comment;
  parentPost?: Post;
}

export default function SearchScreen() {
  const router = useRouter();
  const { id: familyId, boardId } = useLocalSearchParams<{
    id: string;
    boardId: string;
  }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!keyword.trim() || !familyId || !boardId) {
      return;
    }

    try {
      setLoading(true);
      Keyboard.dismiss();

      // Search posts and comments in parallel
      const [posts, comments] = await Promise.all([
        postService.searchPosts(familyId, boardId, keyword),
        commentService.searchComments(familyId, boardId, keyword),
      ]);

      // Create a map to store posts for comment parent lookup
      const postMap = new Map<string, Post>();

      // Fetch parent posts for comments
      const commentParentPostIds = [
        ...new Set(comments.map((c) => c.postId)),
      ];
      await Promise.all(
        commentParentPostIds.map(async (postId) => {
          const post = await postService.getPost(familyId, boardId, postId);
          if (post) {
            postMap.set(postId, post);
          }
        })
      );

      // Combine results
      const searchResults: SearchResultItem[] = [
        ...posts.map((post) => ({
          type: 'post' as const,
          post,
        })),
        ...comments.map((comment) => ({
          type: 'comment' as const,
          comment,
          parentPost: postMap.get(comment.postId),
        })),
      ];

      // Sort by date (newest first)
      searchResults.sort((a, b) => {
        const dateA =
          a.type === 'post' ? a.post?.createdAt : a.comment?.createdAt;
        const dateB =
          b.type === 'post' ? b.post?.createdAt : b.comment?.createdAt;
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });

      setResults(searchResults);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  }, [keyword, familyId, boardId]);

  const handleClear = () => {
    setKeyword('');
    setResults([]);
    setHasSearched(false);
  };

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
        <View
          style={[styles.searchInputContainer, { backgroundColor: colors.surface }]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="投稿やコメントを検索..."
            placeholderTextColor={colors.textSecondary}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={handleSearch}
          disabled={!keyword.trim() || loading}
          style={styles.searchButton}
        >
          <Text
            style={[
              styles.searchButtonText,
              {
                color:
                  !keyword.trim() || loading
                    ? colors.textSecondary
                    : colors.primary,
              },
            ]}
          >
            検索
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            検索中...
          </Text>
        </View>
      ) : hasSearched ? (
        <SearchResultList
          results={results}
          keyword={keyword}
          familyId={familyId!}
          boardId={boardId!}
          emptyMessage="検索結果が見つかりませんでした"
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="search-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            キーワードを入力して検索してください
          </Text>
          <Text style={[styles.emptyStateHint, { color: colors.textSecondary }]}>
            投稿の本文とコメントから検索できます
          </Text>
        </View>
      )}
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
    gap: Layout.spacing.sm,
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: Layout.spacing.sm,
    height: 40,
  },
  searchIcon: {
    marginRight: Layout.spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Layout.spacing.xs,
  },
  clearButton: {
    padding: Layout.spacing.xs,
  },
  searchButton: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  emptyStateHint: {
    fontSize: 14,
    marginTop: Layout.spacing.sm,
    textAlign: 'center',
  },
});
