import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button, Loading, Avatar } from '@/src/components/ui';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { useFamilyStore } from '@/src/store/familyStore';
import { useAuthStore } from '@/src/store/authStore';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';

export default function FamilyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const {
    currentFamily,
    setCurrentFamily,
    posts,
    loadPosts,
    isLoadingPosts,
  } = useFamilyStore();

  const { members } = useFamilyMembers(id);

  useEffect(() => {
    if (id) {
      setCurrentFamily(id);
    }
  }, [id, setCurrentFamily]);

  if (!currentFamily) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Loading />
      </SafeAreaView>
    );
  }

  const isAdmin = currentFamily.adminIds.includes(user?.uid ?? '');

  const handleEdit = () => {
    router.push(`/family/${id}/edit`);
  };

  const handleMembers = () => {
    router.push(`/family/${id}/members`);
  };

  const handleInvite = () => {
    router.push(`/family/${id}/invite`);
  };

  const handleCreatePost = () => {
    router.push('/post/create');
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Family Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Avatar
            name={currentFamily.name}
            imageUrl={currentFamily.iconURL}
            size={80}
          />
          <Text style={[styles.familyName, { color: colors.text }]}>
            {currentFamily.name}
          </Text>
          {currentFamily.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {currentFamily.description}
            </Text>
          )}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentFamily.memberCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                メンバー
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {currentFamily.postCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                投稿
              </Text>
            </View>
          </View>

          {isAdmin && (
            <Button
              title="編集"
              onPress={handleEdit}
              variant="outline"
              size="sm"
              style={styles.editButton}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.surface }]}
            onPress={handleMembers}
          >
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              メンバー一覧
            </Text>
            <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
              {members.length}人
            </Text>
          </TouchableOpacity>

          {isAdmin && (
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.surface }]}
              onPress={handleInvite}
            >
              <Ionicons name="person-add-outline" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                メンバーを招待
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Recent Posts Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              最近の投稿
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                すべて見る
              </Text>
            </TouchableOpacity>
          </View>

          {isLoadingPosts ? (
            <Loading />
          ) : posts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons name="chatbubble-outline" size={48} color={colors.textLight} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                まだ投稿がありません
              </Text>
              <Button
                title="最初の投稿を作成"
                onPress={handleCreatePost}
                size="sm"
                style={styles.createButton}
              />
            </View>
          ) : (
            <View style={styles.postPreview}>
              {posts.slice(0, 3).map((post) => (
                <View
                  key={post.id}
                  style={[styles.postItem, { backgroundColor: colors.surface }]}
                >
                  <Text
                    style={[styles.postAuthor, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {post.authorName}
                  </Text>
                  <Text
                    style={[styles.postContent, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {post.content}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Layout.spacing.lg,
  },
  header: {
    borderRadius: Layout.borderRadius.lg,
    padding: Layout.spacing.lg,
    alignItems: 'center',
    marginBottom: Layout.spacing.lg,
  },
  familyName: {
    fontSize: Layout.fontSize.xxl,
    fontWeight: '700',
    marginTop: Layout.spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: Layout.fontSize.md,
    marginTop: Layout.spacing.xs,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    marginTop: Layout.spacing.lg,
    gap: Layout.spacing.xl,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.xs,
  },
  editButton: {
    marginTop: Layout.spacing.md,
    minWidth: 120,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  actionCard: {
    flex: 1,
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  actionText: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionCount: {
    fontSize: Layout.fontSize.xs,
  },
  section: {
    marginBottom: Layout.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: Layout.fontSize.sm,
    fontWeight: '500',
  },
  emptyState: {
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    marginTop: Layout.spacing.md,
    marginBottom: Layout.spacing.lg,
  },
  createButton: {
    minWidth: 180,
  },
  postPreview: {
    gap: Layout.spacing.sm,
  },
  postItem: {
    borderRadius: Layout.borderRadius.md,
    padding: Layout.spacing.md,
  },
  postAuthor: {
    fontSize: Layout.fontSize.xs,
    marginBottom: Layout.spacing.xs,
  },
  postContent: {
    fontSize: Layout.fontSize.sm,
  },
});
