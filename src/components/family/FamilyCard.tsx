import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Card } from '@components/ui/Card';
import { Avatar } from '@components/ui/Avatar';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import type { UserFamilyRelation } from '@/src/types/family';

interface FamilyCardProps {
  family: UserFamilyRelation;
  onPress?: () => void;
  showUnreadBadge?: boolean;
  testID?: string;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({
  family,
  onPress,
  showUnreadBadge = true,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const hasUnread = family.unreadPostCount > 0;

  return (
    <Card onPress={onPress} testID={testID}>
      <View style={styles.container}>
        <Avatar
          name={family.familyName}
          imageUrl={family.familyIconURL}
          size={48}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {family.familyName}
            </Text>
            {showUnreadBadge && hasUnread && (
              <View
                style={[styles.badge, { backgroundColor: colors.error }]}
              >
                <Text style={styles.badgeText}>
                  {family.unreadPostCount > 99 ? '99+' : family.unreadPostCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[styles.relation, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {family.relation} • {family.role === 'admin' ? '管理者' : 'メンバー'}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: Layout.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: Layout.fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  relation: {
    fontSize: Layout.fontSize.sm,
    marginTop: Layout.spacing.xs,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xs,
    marginLeft: Layout.spacing.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
  },
});
