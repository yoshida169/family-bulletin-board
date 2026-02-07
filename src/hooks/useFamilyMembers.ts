import { useEffect } from 'react';
import { useFamilyStore } from '@store/familyStore';

export const useFamilyMembers = (familyId?: string | null) => {
  const {
    members,
    currentFamilyId,
    loadFamilyMembers,
    setMembers,
  } = useFamilyStore();

  // Auto-load members when familyId changes
  useEffect(() => {
    const targetFamilyId = familyId || currentFamilyId;
    if (targetFamilyId) {
      loadFamilyMembers(targetFamilyId).catch((error) => {
        console.error('Failed to load family members:', error);
      });
    } else {
      setMembers([]);
    }
  }, [familyId, currentFamilyId, loadFamilyMembers, setMembers]);

  return {
    members,
    loadFamilyMembers,
  };
};
