import { useEffect } from 'react';
import { useAuthStore } from '@store/authStore';

export const useAuth = () => {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    isInitialized,
    initialize,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, [initialize]);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    isInitialized,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError,
  };
};
