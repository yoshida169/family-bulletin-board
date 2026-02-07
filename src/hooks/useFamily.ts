import { useEffect } from 'react';
import { useFamilyStore } from '@store/familyStore';
import { useAuthStore } from '@store/authStore';

export const useFamily = () => {
  const {
    userFamilies,
    families,
    isLoadingFamilies,
    isLoading,
    currentFamily,
    currentFamilyId,
    error,
    loadUserFamilies,
    clearFamilies,
    setCurrentFamily,
    selectFamily,
    clearCurrentFamily,
    createFamily,
    updateFamily,
    deleteFamily,
    clearError,
  } = useFamilyStore();

  const { user } = useAuthStore();

  // Auto-load user families when user is authenticated
  useEffect(() => {
    if (user?.uid) {
      loadUserFamilies(user.uid).catch((error) => {
        console.error('Failed to load user families:', error);
      });
    } else {
      clearFamilies();
    }
  }, [user?.uid, loadUserFamilies, clearFamilies]);

  return {
    // State
    userFamilies,
    families,
    isLoadingFamilies,
    isLoading,
    currentFamily,
    currentFamilyId,
    error,

    // Actions
    loadUserFamilies,
    setCurrentFamily,
    selectFamily,
    clearCurrentFamily,
    createFamily,
    updateFamily,
    deleteFamily,
    clearError,
  };
};
