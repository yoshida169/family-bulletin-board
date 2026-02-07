import { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { useAuthStore } from '@/src/store/authStore';
import { useFamilyStore } from '@/src/store/familyStore';
import type { Post } from '@/src/types/post';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user } = useAuthStore();
  const {
    userFamilies,
    isLoadingFamilies,
    currentFamily,
    currentFamilyId,
    posts,
    isLoadingPosts,
    hasMorePosts,
    loadUserFamilies,
    setCurrentFamily,
    loadPosts,
    loadMorePosts,
    markPostAsRead,
  } = useFamilyStore();

  // Load user families on mount
  useEffect(() => {
    if (user?.id) {
      loadUserFamilies(user.id);
    }
  }, [user?.id, loadUserFamilies]);

  // Set first family as current when families are loaded
  useEffect(() => {
    if (userFamilies.length > 0 && !currentFamilyId) {
      setCurrentFamily(userFamilies[0].familyId);
    }
  }, [userFamilies, currentFamilyId, setCurrentFamily]);

  const onRefresh = useCallback(() => {
    loadPosts();
  }, [loadPosts]);

  const onEndReached = useCallback(() => {
    if (hasMorePosts && !isLoadingPosts) {
      loadMorePosts();
    }
  }, [hasMorePosts, isLoadingPosts, loadMorePosts]);

  const handlePostPress = useCallback(
    (post: Post) => {
      if (user?.id && !post.readBy.includes(user.id)) {
        markPostAsRead(post.id, user.id);
      }
      router.push(`/post/${post.id}`);
    },
    [user?.id, router, markPostAsRead]
  );

  const renderPost = ({ item }: { item: Post }) => {
    const isUnread = user?.id ? !item.readBy.includes(user.id) : false;

    return (
      <TouchableOpacity
        onPress={() => handlePostPress(item)}
        activeOpacity={0.7}
      >
        <Card style={[styles.postCard, isUnread && styles.unreadCard]}>
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text style={styles.avatarText}>
                  {item.authorName.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={[styles.authorName, { color: colors.text }]}>
                  {item.authorName}
                </Text>
                <Text style={[styles.postDate, { color: colors.textLight }]}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
            {item.isPinned && (
              <View style={[styles.pinnedBadge, { backgroundColor: colors.warning }]}>
                <Ionicons name="pin" size={12} color="#fff" />
              </View>
            )}
          </View>
          <Text
            style={[styles.postContent, { color: colors.text }]}
            numberOfLines={3}
          >
            {item.content}
          </Text>
          <View style={styles.postFooter}>
            <View style={styles.footerItem}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={colors.textLight}
              />
              <Text style={[styles.footerText, { color: colors.textLight }]}>
                {item.commentCount}
              </Text>
            </View>
            {isUnread && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>未読</Text>
              </View>
            )}
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoadingFamilies || isLoadingPosts) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (userFamilies.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="people-outline" size={48} color={colors.textLight} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            ファミリーに参加しましょう
          </Text>
          <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
            ファミリーを作成するか、招待コードで参加してください
          </Text>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/family/create')}
          >
            <Text style={styles.actionButtonText}>ファミリーを作成</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textLight} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          まだ投稿がありません
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          最初の投稿をしてみましょう
        </Text>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/post/create')}
        >
          <Text style={styles.actionButtonText}>投稿を作成</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => {
    if (userFamilies.length === 0) return null;

    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.familySelector, { backgroundColor: colors.surface }]}
          onPress={() => {
            // TODO: Show family picker modal
          }}
        >
          <Text style={[styles.familyName, { color: colors.text }]}>
            {currentFamily?.name ?? 'ファミリーを選択'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingPosts || posts.length === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingPosts && posts.length > 0}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      />

      {/* FAB for creating new post */}
      {currentFamilyId && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/post/create')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 7) return `${days}日前`;

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: Layout.spacing.md,
  },
  header: {
    marginBottom: Layout.spacing.md,
  },
  familySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  familyName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  emptyTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    marginBottom: Layout.spacing.sm,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Layout.spacing.lg,
  },
  actionButton: {
    paddingHorizontal: Layout.spacing.xl,
    paddingVertical: Layout.spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  postCard: {
    marginBottom: Layout.spacing.md,
    padding: Layout.spacing.md,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Layout.spacing.sm,
  },
  avatarText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
    color: '#fff',
  },
  authorName: {
    fontSize: Layout.fontSize.md,
    fontWeight: '600',
  },
  postDate: {
    fontSize: Layout.fontSize.sm,
  },
  pinnedBadge: {
    padding: 4,
    borderRadius: 12,
  },
  postContent: {
    fontSize: Layout.fontSize.md,
    lineHeight: 22,
    marginBottom: Layout.spacing.sm,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: Layout.fontSize.sm,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: Layout.spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Layout.spacing.lg,
    bottom: Layout.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
