import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { Colors } from '@constants/colors';
import { Layout } from '@constants/layout';
import { RELATIONS } from '@constants/relations';
import type { Relation } from '@/src/types/family';

interface RelationPickerProps {
  value: Relation | null;
  onSelect: (relation: Relation) => void;
  allowCustom?: boolean;
  testID?: string;
}

export const RelationPicker: React.FC<RelationPickerProps> = ({
  value,
  onSelect,
  allowCustom = false,
  testID,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const [customRelation, setCustomRelation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectRelation = (relation: Relation) => {
    setError(null);
    onSelect(relation);
  };

  const handleAddCustom = () => {
    if (!customRelation.trim()) {
      setError('続柄を入力してください');
      return;
    }
    setError(null);
    onSelect(customRelation.trim() as Relation);
    setCustomRelation('');
  };

  return (
    <View testID={testID} style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {RELATIONS.map((relation) => {
          const isSelected = value === relation.value;
          return (
            <TouchableOpacity
              key={relation.value}
              testID={isSelected ? `relation-${relation.value}-selected` : `relation-${relation.value}`}
              onPress={() => handleSelectRelation(relation.value)}
              style={[
                styles.relationButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.relationText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {relation.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {allowCustom && (
        <View style={styles.customContainer}>
          <Input
            placeholder="カスタム続柄を入力"
            value={customRelation}
            onChangeText={(text) => {
              setCustomRelation(text);
              setError(null);
            }}
            error={error}
            style={styles.customInput}
          />
          <Button
            title="追加"
            onPress={handleAddCustom}
            size="sm"
            style={styles.addButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Layout.spacing.md,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: Layout.spacing.xs,
  },
  relationButton: {
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    marginHorizontal: Layout.spacing.xs,
  },
  relationText: {
    fontSize: Layout.fontSize.md,
    fontWeight: '500',
  },
  customContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },
  customInput: {
    flex: 1,
  },
  addButton: {
    marginTop: 0,
  },
});
