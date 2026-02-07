import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui';
import { FamilyList } from '@/src/components/family/FamilyList';
import { useFamily } from '@/src/hooks/useFamily';
import { useAuthStore } from '@/src/store/authStore';
import type { UserFamilyRelation } from '@/src/types/family';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';

export default function FamilyScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const {
    userFamilies,
    isLoadingFamilies,
    loadUserFamilies,
  } = useFamily();
  const user = useAuthStore((state) => state.user);

  const handleFamilyPress = (family: UserFamilyRelation) => {
    router.push(`/family/${family.familyId}`);
  };

  const handleRefresh = async () => {
    if (user?.uid) {
      await loadUserFamilies(user.uid);
    }
  };

  const handleCreateFamily = () => {
    router.push('/family/create');
  };

  const handleJoinFamily = () => {
    router.push('/family/join');
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        マイファミリー
      </Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleJoinFamily}
        >
          <Ionicons name="enter-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCreateFamily}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
        <Ionicons name="people-outline" size={48} color={colors.textLight} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        ファミリーに参加しましょう
      </Text>
      <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
        新しいファミリーを作成するか、
        招待コードで既存のファミリーに参加できます
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          title="ファミリーを作成"
          onPress={handleCreateFamily}
          style={styles.button}
        />
        <Button
          title="招待コードで参加"
          onPress={handleJoinFamily}
          variant="outline"
          style={styles.button}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      {renderHeader()}
      
      {userFamilies.length === 0 && !isLoadingFamilies ? (
        renderEmptyState()
      ) : (
        <FamilyList
          families={userFamilies}
          onFamilyPress={handleFamilyPress}
          loading={isLoadingFamilies}
          onRefresh={handleRefresh}
          refreshing={isLoadingFamilies}
        />
      )}
    </SafeAreaView>
  );
}
          style={styles.button}
        />
        <Button
          title="招待コードで参加"
          onPress={() => router.push('/family/join')}
          variant="outline"
          style={styles.button}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['left', 'right']}
    >
      <FlatList
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  headerTitle: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  headerButton: {
    padding: Layout.spacing.xs,
  },
  listContent: {
    flexGrow: 1,
    padding: Layout.spacing.md,
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
    marginBottom: Layout.spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    gap: Layout.spacing.md,
  },
  button: {
    width: '100%',
  },
});
