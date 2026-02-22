import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Loading, Avatar } from '@/src/components/ui';
import { CommentSection } from '@/src/components/post/CommentSection';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { postService } from '@/src/services/firebase/post';
import { commentService } from '@/src/services/firebase/comment';
import { useAuthStore } from '@/src/store/authStore';
import { usePermission } from '@/src/hooks/usePermission';
import type { Post, Comment } from '@/src/types/post';

export default function PostDetailScreen() {
  const router = useRouter();
  const {
    id: familyId,
    boardId,
    postId,
  } = useLocalSearchParams<{
    id: string;
    boardId: string;
    postId: string;
  }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);
  const permissions = usePermission(familyId);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (familyId && boardId && postId) {
      loadPostData();
    }
  }, [familyId, boardId, postId]);

  useEffect(() => {
    if (!familyId || !boardId || !postId) return;

    // Subscribe to comments in realtime
    const unsubscribe = commentService.subscribeToPostComments(
      familyId,
      boardId,
      postId,
      (updatedComments) => {
        setComments(updatedComments);
      }
    );

    return () => unsubscribe();
  }, [familyId, boardId, postId]);

  useEffect(() => {
    // Mark post as read when viewing
    if (familyId && boardId && postId && user?.uid) {
      postService.markAsRead(familyId, boardId, postId, user.uid);
    }
  }, [familyId, boardId, postId, user?.uid]);

  const loadPostData = async () => {
    if (!familyId || !boardId || !postId) return;

    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        postService.getPost(familyId, boardId, postId),
        commentService.getPostComments(familyId, boardId, postId),
      ]);

      setPost(postData);
      setComments(commentsData);
    } catch (error) {
      console.error('Failed to load post data:', error);
      Alert.alert('エラー', '投稿の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(
      `/family/${familyId}/board/${boardId}/post/${postId}/edit`
    );
  };

  const handleDelete = async () => {
    if (!familyId || !boardId || !postId) return;

    Alert.alert(
      '投稿を削除',
      'この投稿を削除してもよろしいですか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await postService.deletePost(familyId, boardId, postId);
              router.back();
            } catch (error) {
              console.error('Failed to delete post:', error);
              Alert.alert('エラー', '投稿の削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const handleTogglePin = async () => {
    if (!familyId || !boardId || !postId || !post) return;

    try {
      await postService.togglePin(familyId, boardId, postId, !post.isPinned);
      setPost({ ...post, isPinned: !post.isPinned });
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      Alert.alert('エラー', 'ピン留めの変更に失敗しました');
    }
  };

  if (loading || !post) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <Loading />
      </SafeAreaView>
    );
  }

  const isAuthor = user?.uid === post.authorId;

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>投稿</Text>
        <View style={styles.headerActions}>
          {permissions.canPinPost && (
            <TouchableOpacity onPress={handleTogglePin} style={styles.actionButton}>
              <Ionicons
                name={post?.isPinned ? 'pin' : 'pin-outline'}
                size={24}
                color={post?.isPinned ? colors.primary : colors.text}
              />
            </TouchableOpacity>
          )}
          {isAuthor && (
            <>
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <Ionicons name="create-outline" size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Post Content */}
        <View
          style={[
            styles.postContainer,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          <View style={styles.postHeader}>
            <Avatar
              name={post.authorName}
              source={post.authorPhotoURL}
              size="md"
            />
            <View style={styles.postHeaderInfo}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {post.authorName}
              </Text>
              <Text style={[styles.postDate, { color: colors.textSecondary }]}>
                {post.createdAt.toLocaleString('ja-JP')}
              </Text>
            </View>
            {post.isPinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={20} color={colors.primary} />
              </View>
            )}
          </View>

          <Text style={[styles.postContent, { color: colors.text }]}>
            {post.content}
          </Text>

          {post.imageUrls.length > 0 && (
            <View style={styles.imagesContainer}>
              {/* TODO: Display images */}
              <Text style={[styles.imageCount, { color: colors.textSecondary }]}>
                📷 {post.imageUrls.length}枚の画像
              </Text>
            </View>
          )}

          <View style={styles.postFooter}>
            <View style={styles.postStat}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {post.commentCount}
              </Text>
            </View>
            <View style={styles.postStat}>
              <Ionicons
                name="checkmark-done-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                既読 {post.readBy.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        {user && (
          <CommentSection
            familyId={familyId}
            boardId={boardId}
            postId={postId}
            comments={comments}
            currentUserId={user.uid}
            currentUserName={user.displayName ?? '名無し'}
            currentUserPhotoURL={user.photoURL}
            onCommentCreated={loadPostData}
          />
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: Layout.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: Layout.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  actionButton: {
    padding: Layout.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  postContainer: {
    padding: Layout.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  postDate: {
    fontSize: 12,
    marginTop: 2,
  },
  pinnedBadge: {
    padding: Layout.spacing.xs,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Layout.spacing.md,
  },
  imagesContainer: {
    marginBottom: Layout.spacing.md,
  },
  imageCount: {
    fontSize: 14,
  },
  postFooter: {
    flexDirection: 'row',
    gap: Layout.spacing.lg,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
});
