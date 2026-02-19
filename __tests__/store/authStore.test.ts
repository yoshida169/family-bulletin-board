import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAuthStore } from '@/src/store/authStore';
import { authService } from '@/src/services/firebase/auth';
import type { User, LoginCredentials, SignUpCredentials } from '@/src/types/auth';

// authService のモック
jest.mock('@/src/services/firebase/auth');

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('authStore', () => {
  const mockUser: User = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    authProvider: 'email',
    settings: {
      pushNotificationsEnabled: true,
      notifyOnNewPost: true,
      notifyOnComment: true,
      notifyOnMention: true,
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    lastLoginAt: new Date('2024-01-01'),
    isDeleted: false,
    deletedAt: null,
    scheduledDeletionAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // ストアをリセット
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setUser(null);
    });
  });

  describe('初期状態', () => {
    it('デフォルト値が正しく設定されている', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isInitialized).toBe(false);
    });
  });

  describe('initialize', () => {
    it('認証状態の変更を監視する', async () => {
      let authStateCallback: ((user: any) => void) | null = null;

      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });

      mockAuthService.getUserData.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      // Firebase Authの認証状態が変更されたことをシミュレート
      await act(async () => {
        if (authStateCallback) {
          authStateCallback({ uid: 'test-uid', email: 'test@example.com' } as any);
        }
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('ユーザーがいない場合は未認証状態になる', async () => {
      let authStateCallback: ((user: any) => void) | null = null;

      mockAuthService.onAuthStateChanged.mockImplementation((callback) => {
        authStateCallback = callback;
        return jest.fn();
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initialize();
      });

      await act(async () => {
        if (authStateCallback) {
          authStateCallback(null);
        }
      });

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('signIn', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('ログインに成功する', async () => {
      mockAuthService.signInWithEmail.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn(credentials);
      });

      expect(mockAuthService.signInWithEmail).toHaveBeenCalledWith(credentials);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('ログイン失敗時はエラーを設定する', async () => {
      const error = Object.assign(new Error('Invalid credentials'), {
        code: 'auth/invalid-credential',
      });

      mockAuthService.signInWithEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signIn(credentials);
        } catch (e) {
          // エラーは期待通り
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('メールアドレスまたはパスワードが間違っています');
    });
  });

  describe('signUp', () => {
    const credentials: SignUpCredentials = {
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
    };

    it('新規登録に成功する', async () => {
      const newUser = { ...mockUser, email: 'newuser@example.com', displayName: 'New User' };
      mockAuthService.signUpWithEmail.mockResolvedValue(newUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signUp(credentials);
      });

      expect(mockAuthService.signUpWithEmail).toHaveBeenCalledWith(credentials);
      expect(result.current.user).toEqual(newUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('登録失敗時はエラーを設定する', async () => {
      const error = Object.assign(new Error('Email already in use'), {
        code: 'auth/email-already-in-use',
      });

      mockAuthService.signUpWithEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signUp(credentials);
        } catch (e) {
          // エラーは期待通り
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('このメールアドレスは既に使用されています');
    });
  });

  describe('signOut', () => {
    it('ログアウトに成功する', async () => {
      mockAuthService.signOut.mockResolvedValue();

      const { result } = renderHook(() => useAuthStore());

      // まずユーザーを設定
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockAuthService.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('ログアウト失敗時はエラーを設定する', async () => {
      const error = new Error('Sign out failed');
      mockAuthService.signOut.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signOut();
        } catch (e) {
          // エラーは期待通り
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Sign out failed');
    });
  });

  describe('resetPassword', () => {
    const email = 'test@example.com';

    it('パスワードリセットメール送信に成功する', async () => {
      mockAuthService.sendPasswordResetEmail.mockResolvedValue();

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.resetPassword(email);
      });

      expect(mockAuthService.sendPasswordResetEmail).toHaveBeenCalledWith(email);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('メール送信失敗時はエラーを設定する', async () => {
      const error = Object.assign(new Error('Invalid email'), {
        code: 'auth/invalid-email',
      });

      mockAuthService.sendPasswordResetEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.resetPassword(email);
        } catch (e) {
          // エラーは期待通り
        }
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('メールアドレスの形式が正しくありません');
    });
  });

  describe('clearError', () => {
    it('エラーをクリアできる', () => {
      const { result } = renderHook(() => useAuthStore());

      // エラーを設定
      act(() => {
        (result.current as any).error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('ユーザーを設定できる', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('nullを設定すると未認証状態になる', () => {
      const { result } = renderHook(() => useAuthStore());

      // まずユーザーを設定
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);

      // null を設定
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('エラーメッセージ', () => {
    it('email-already-in-useエラーを日本語で返す', async () => {
      const error = Object.assign(new Error('Email already in use'), {
        code: 'auth/email-already-in-use',
      });

      mockAuthService.signUpWithEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signUp({
            email: 'test@example.com',
            password: 'password123',
            displayName: 'Test',
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('このメールアドレスは既に使用されています');
    });

    it('weak-passwordエラーを日本語で返す', async () => {
      const error = Object.assign(new Error('Weak password'), {
        code: 'auth/weak-password',
      });

      mockAuthService.signUpWithEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signUp({
            email: 'test@example.com',
            password: '123',
            displayName: 'Test',
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('パスワードが弱すぎます。8文字以上で入力してください');
    });

    it('unknown errorの場合はエラーメッセージをそのまま返す', async () => {
      const error = new Error('Unknown error');

      mockAuthService.signInWithEmail.mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signIn({
            email: 'test@example.com',
            password: 'password123',
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.error).toBe('Unknown error');
    });
  });
});
