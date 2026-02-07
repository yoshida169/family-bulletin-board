import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Button, Loading } from '@/src/components/ui';
import { MemberList } from '@/src/components/family/MemberList';
import { Colors } from '@/src/constants/colors';
import { Layout } from '@/src/constants/layout';
import { useFamilyStore } from '@/src/store/familyStore';
import { useAuthStore } from '@/src/store/authStore';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';

export default function FamilyMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const user = useAuthStore((state) => state.user);

  const { currentFamily, setCurrentFamily } = useFamilyStore();
  const { members, loadFamilyMembers } = useFamilyMembers(id);

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

  const handleInvite = () => {
    router.push(`/family/${id}/invite`);
  };

  const handleRefresh = async () => {
    if (id) {
      await loadFamilyMembers(id);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          ファミリーメンバー
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {members.length}人のメンバー
        </Text>
      </View>

      <MemberList
        members={members}
        onRefresh={handleRefresh}
        testID="member-list"
      />

      {isAdmin && (
        <View style={[styles.footer, { backgroundColor: colors.background }]}>
          <Button
            title="メンバーを招待"
            onPress={handleInvite}
            testID="invite-member-button"
          />
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
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: '700',
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    fontSize: Layout.fontSize.md,
  },
  footer: {
    padding: Layout.spacing.lg,
    paddingTop: Layout.spacing.md,
  },
});
