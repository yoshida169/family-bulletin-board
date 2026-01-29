import { create } from 'zustand';
import { User, LoginCredentials, SignUpCredentials } from '@types/auth';
import { authService } from '@services/firebase/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  isInitialized: boolean;
}

interface AuthActions {
  initialize: () => () => void;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  isInitialized: false,

  initialize: () => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await authService.getUserData(firebaseUser.uid);
          set({
            user: userData,
            isAuthenticated: !!userData,
            isInitialized: true,
            isLoading: false,
          });
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            isLoading: false,
          });
        }
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
        });
      }
    });

    return unsubscribe;
  },

  signIn: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signInWithEmail(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signUp: async (credentials: SignUpCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signUpWithEmail(credentials);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.sendPasswordResetEmail(email);
      set({ isLoading: false });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },
}));

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const firebaseError = error as { code?: string };
    switch (firebaseError.code) {
      case 'auth/email-already-in-use':
        return 'このメールアドレスは既に使用されています';
      case 'auth/invalid-email':
        return 'メールアドレスの形式が正しくありません';
      case 'auth/operation-not-allowed':
        return 'この操作は許可されていません';
      case 'auth/weak-password':
        return 'パスワードが弱すぎます。8文字以上で入力してください';
      case 'auth/user-disabled':
        return 'このアカウントは無効化されています';
      case 'auth/user-not-found':
        return 'アカウントが見つかりません';
      case 'auth/wrong-password':
        return 'パスワードが間違っています';
      case 'auth/invalid-credential':
        return 'メールアドレスまたはパスワードが間違っています';
      case 'auth/too-many-requests':
        return 'リクエストが多すぎます。しばらくしてからお試しください';
      default:
        return error.message || '予期せぬエラーが発生しました';
    }
  }
  return '予期せぬエラーが発生しました';
}
