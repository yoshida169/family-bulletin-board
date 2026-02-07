import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { FamilyCard } from './FamilyCard';
import { Loading } from '@components/ui/Loading';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import type { UserFamilyRelation } from '@/src/types/family';

interface FamilyListProps {
  families: UserFamilyRelation[];
  onFamilyPress?: (family: UserFamilyRelation) => void;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  testID?: string;
}

export const FamilyList: React.FC<FamilyListProps> = ({
  families,
  onFamilyPress,
  loading = false,
  onRefresh,
  refreshing = false,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  if (loading && families.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Loading testID="loading-indicator" />
      </View>
    );
  }

  if (families.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          ファミリーがありません
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      testID={testID}
      data={families}
      keyExtractor={(item) => item.familyId}
      renderItem={({ item }) => (
        <FamilyCard
          family={item}
          onPress={() => onFamilyPress?.(item)}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
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
});
