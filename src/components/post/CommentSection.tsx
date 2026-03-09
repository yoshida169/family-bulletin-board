import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@components/ui/Avatar';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import { commentService } from '@services/firebase/comment';
import type { Comment } from '@/src/types/post';

interface CommentSectionProps {
  familyId: string;
  boardId: string;
  postId: string;
  comments: Comment[];
  currentUserId: string;
  currentUserName: string;
  currentUserPhotoURL?: string | null;
  onCommentCreated?: () => void;
  testID?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  familyId,
  boardId,
  postId,
  comments,
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onCommentCreated,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const handleSubmitComment = async () => {
    if (!commentText.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await commentService.createComment({
        postId,
        boardId,
        familyId,
        content: commentText.trim(),
        authorId: currentUserId,
        authorName: currentUserName,
        authorPhotoURL: currentUserPhotoURL,
        parentCommentId: replyingTo?.id,
      });

      setCommentText('');
      setReplyingTo(null);
      onCommentCreated?.();
    } catch (error) {
      console.error('Failed to create comment:', error);
      Alert.alert('エラー', 'コメントの投稿に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const isReply = !!item.parentCommentId;

    return (
      <View
        style={[
          styles.commentItem,
          isReply && styles.replyComment,
          { borderLeftColor: colors.border },
        ]}
      >
        <Avatar
          name={item.authorName}
          source={item.authorPhotoURL}
          size="sm"
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={[styles.authorName, { color: colors.text }]}>
              {item.authorName}
            </Text>
            <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
              {item.createdAt.toLocaleDateString('ja-JP')}
            </Text>
          </View>
          <Text style={[styles.commentText, { color: colors.text }]}>
            {item.content}
          </Text>
          {!isReply && (
            <TouchableOpacity
              onPress={() => handleReply(item)}
              style={styles.replyButton}
            >
              <Ionicons
                name="return-down-forward"
                size={14}
                color={colors.primary}
              />
              <Text style={[styles.replyButtonText, { color: colors.primary }]}>
                返信
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} testID={testID}>
      {/* Comments List */}
      <View style={styles.commentsHeader}>
        <Text style={[styles.commentsTitle, { color: colors.text }]}>
          コメント ({comments.length})
        </Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              まだコメントがありません
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />

      {/* Comment Input */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        {replyingTo && (
          <View
            style={[
              styles.replyingToBar,
              { backgroundColor: colors.background },
            ]}
          >
            <Text style={[styles.replyingToText, { color: colors.textSecondary }]}>
              {replyingTo.authorName}に返信
            </Text>
            <TouchableOpacity onPress={handleCancelReply}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <Avatar
            name={currentUserName}
            source={currentUserPhotoURL}
            size="sm"
          />
          <TextInput
            style={[
              styles.textInput,
              { color: colors.text, backgroundColor: colors.background },
            ]}
            placeholder="コメントを入力..."
            placeholderTextColor={colors.textSecondary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={!commentText.trim() || isSubmitting}
            style={[
              styles.sendButton,
              (!commentText.trim() || isSubmitting) && styles.sendButtonDisabled,
            ]}
          >
            <Ionicons
              name="send"
              size={20}
              color={
                !commentText.trim() || isSubmitting
                  ? colors.textSecondary
                  : colors.primary
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  commentsHeader: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Layout.spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: Layout.spacing.md,
  },
  replyComment: {
    marginLeft: Layout.spacing.xl,
    paddingLeft: Layout.spacing.md,
    borderLeftWidth: 2,
  },
  commentContent: {
    flex: 1,
    marginLeft: Layout.spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.spacing.xs,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 12,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Layout.spacing.xs,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Layout.spacing.xs,
  },
  replyButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    paddingVertical: Layout.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  inputContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  replyingToBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: 8,
    marginBottom: Layout.spacing.xs,
  },
  replyingToText: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderRadius: 18,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    fontSize: 14,
  },
  sendButton: {
    padding: Layout.spacing.xs,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
