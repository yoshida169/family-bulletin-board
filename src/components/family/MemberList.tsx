import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Loading } from '@components/ui/Loading';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import type { FamilyMember } from '@/src/types/family';

interface MemberListProps {
  members: FamilyMember[];
  onMemberPress?: (member: FamilyMember) => void;
  loading?: boolean;
  testID?: string;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  onMemberPress,
  loading = false,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Sort members: admins first, then by joinedAt
  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return a.joinedAt.getTime() - b.joinedAt.getTime();
  });

  if (loading && members.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Loading testID="loading-indicator" />
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          メンバーがいません
        </Text>
      </View>
    );
  }

  const renderMember = ({ item }: { item: FamilyMember }) => (
    <Card
      onPress={() => onMemberPress?.(item)}
      testID={`member-card-${item.userId}`}
    >
      <View style={styles.memberContainer}>
        <Avatar
          name={item.displayName}
          imageUrl={item.photoURL}
          size={48}
        />
        <View style={styles.memberContent}>
          <View style={styles.memberHeader}>
            <Text
              style={[styles.memberName, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.displayName}
            </Text>
            {item.role === 'admin' && (
              <View
                style={[styles.adminBadge, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.adminBadgeText}>管理者</Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.memberRelation, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.relation}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <FlatList
      testID={testID}
      data={sortedMembers}
      keyExtractor={(item) => item.userId}
      renderItem={renderMember}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.spacing.lg,
  },
  listContent: {
    padding: Layout.spacing.md,
  },
  emptyText: {
    fontSize: Layout.fontSize.md,
    textAlign: 'center',
  },
  memberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberContent: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberName: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  memberRelation: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.xs,
  },
  adminBadge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.xs,
    borderRadius: Layout.borderRadius.sm,
    marginLeft: Layout.spacing.sm,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
});
