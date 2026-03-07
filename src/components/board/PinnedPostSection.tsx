import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import type { Post } from '@/src/types/post';

interface PinnedPostSectionProps {
  posts: Post[];
  onPressPost?: (post: Post) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const PinnedPostSection: React.FC<PinnedPostSectionProps> = ({
  posts,
  onPressPost,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // ピン留め投稿がない場合は表示しない
  if (posts.length === 0) {
    return null;
  }

  const formatDate = (date: Date): string => {
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
  };

  return (
    <View testID={testID} style={[styles.container, style]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Ionicons name="pin" size={18} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.text }]}>
          ピン留め投稿
        </Text>
      </View>

      {posts.map((post) => (
        <TouchableOpacity
          key={post.id}
          testID={`pinned-post-item-${post.id}`}
          style={[
            styles.postItem,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
          onPress={() => onPressPost?.(post)}
          activeOpacity={0.7}
        >
          <View style={styles.postHeader}>
            <View style={styles.authorInfo}>
              <Text style={[styles.authorName, { color: colors.text }]}>
                {post.authorName}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatDate(post.createdAt)}
              </Text>
            </View>
            <Ionicons name="pin" size={16} color={colors.primary} />
          </View>

          <Text
            style={[styles.content, { color: colors.text }]}
            numberOfLines={2}
          >
            {post.content}
          </Text>

          {post.imageUrls.length > 0 && (
            <View style={styles.imageIndicator}>
              <Ionicons name="image" size={14} color={colors.textSecondary} />
              <Text style={[styles.imageCount, { color: colors.textSecondary }]}>
                {post.imageUrls.length}
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.commentCount}>
              <Ionicons
                name="chatbubble-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {post.commentCount}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Layout.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: Layout.spacing.xs,
  },
  postItem: {
    padding: Layout.spacing.md,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: Layout.spacing.xs,
  },
  timestamp: {
    fontSize: 12,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Layout.spacing.xs,
  },
  imageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.spacing.xs,
  },
  imageCount: {
    fontSize: 12,
    marginLeft: Layout.spacing.xxs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    marginLeft: Layout.spacing.xxs,
  },
});
