import { authService } from '@/src/services/firebase/auth';
import { mockAuthInstance } from '@/__mocks__/@react-native-firebase/auth';
import { mockFirestoreInstance } from '@/__mocks__/@react-native-firebase/firestore';
import type { LoginCredentials, SignUpCredentials } from '@/src/types/auth';

// Firebase モック
jest.mock('@react-native-firebase/auth');
jest.mock('@react-native-firebase/firestore');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthInstance.currentUser = null;
  });

  describe('getCurrentUser', () => {
    it('現在のユーザーを返す', () => {
      const mockUser = { uid: 'test-uid', email: 'test@example.com' };
      mockAuthInstance.currentUser = mockUser as any;

      const result = authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('ユーザーがいない場合はnullを返す', () => {
      mockAuthInstance.currentUser = null;

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('signInWithEmail', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockFirebaseUser = {
      uid: 'test-uid',
      email: 'test@example.com',
    };

    const mockUserData = {
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

    it('メール/パスワードでログインできる', async () => {
      mockAuthInstance.signInWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      } as any);

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockGet = jest.fn().mockResolvedValue({
        data: () => mockUserData,
      });
      const mockDoc = jest.fn().mockReturnValue({
        update: mockUpdate,
        get: mockGet,
      });
      mockFirestoreInstance.collection.mockReturnValue({
        doc: mockDoc,
      } as any);

      const result = await authService.signInWithEmail(credentials);

      expect(mockAuthInstance.signInWithEmailAndPassword).toHaveBeenCalledWith(
        credentials.email,
        credentials.password
      );
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toEqual(mockUserData);
    });

    it('認証エラーをスローする', async () => {
      const error = new Error('Invalid credentials');
      mockAuthInstance.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(authService.signInWithEmail(credentials)).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('signUpWithEmail', () => {
    const credentials: SignUpCredentials = {
      email: 'newuser@example.com',
      password: 'password123',
      displayName: 'New User',
    };

    const mockFirebaseUser = {
      uid: 'new-uid',
      email: 'newuser@example.com',
      updateProfile: jest.fn().mockResolvedValue(undefined),
    };

    it('新しいアカウントを作成できる', async () => {
      mockAuthInstance.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockFirebaseUser,
      } as any);

      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn().mockReturnValue({
        set: mockSet,
      });
      mockFirestoreInstance.collection.mockReturnValue({
        doc: mockDoc,
      } as any);

      const result = await authService.signUpWithEmail(credentials);

      expect(mockAuthInstance.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        credentials.email,
        credentials.password
      );
      expect(mockFirebaseUser.updateProfile).toHaveBeenCalledWith({
        displayName: credentials.displayName,
      });
      expect(mockSet).toHaveBeenCalled();
      expect(result.uid).toBe('new-uid');
      expect(result.email).toBe('newuser@example.com');
      expect(result.displayName).toBe('New User');
    });

    it('既存のメールアドレスでエラーをスローする', async () => {
      const error = new Error('Email already in use');
      mockAuthInstance.createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(authService.signUpWithEmail(credentials)).rejects.toThrow(
        'Email already in use'
      );
    });
  });

  describe('signOut', () => {
    it('ログアウトできる', async () => {
      mockAuthInstance.signOut.mockResolvedValue(undefined as any);

      await authService.signOut();

      expect(mockAuthInstance.signOut).toHaveBeenCalled();
    });

    it('ログアウト時のエラーをスローする', async () => {
      const error = new Error('Sign out failed');
      mockAuthInstance.signOut.mockRejectedValue(error);

      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('sendPasswordResetEmail', () => {
    const email = 'test@example.com';

    it('パスワードリセットメールを送信できる', async () => {
      mockAuthInstance.sendPasswordResetEmail.mockResolvedValue(undefined as any);

      await authService.sendPasswordResetEmail(email);

      expect(mockAuthInstance.sendPasswordResetEmail).toHaveBeenCalledWith(email);
    });

    it('無効なメールアドレスでエラーをスローする', async () => {
      const error = new Error('Invalid email');
      mockAuthInstance.sendPasswordResetEmail.mockRejectedValue(error);

      await expect(authService.sendPasswordResetEmail(email)).rejects.toThrow('Invalid email');
    });
  });

  describe('getUserData', () => {
    const uid = 'test-uid';

    const mockUserData = {
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
      createdAt: { toDate: () => new Date('2024-01-01') },
      updatedAt: { toDate: () => new Date('2024-01-01') },
      lastLoginAt: { toDate: () => new Date('2024-01-01') },
      isDeleted: false,
      deletedAt: null,
      scheduledDeletionAt: null,
    };

    it('ユーザーデータを取得できる', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => mockUserData,
      });
      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });
      mockFirestoreInstance.collection.mockReturnValue({
        doc: mockDoc,
      } as any);

      const result = await authService.getUserData(uid);

      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith(uid);
      expect(result).toBeTruthy();
      expect(result?.uid).toBe('test-uid');
    });

    it('ユーザーが存在しない場合はnullを返す', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });
      const mockDoc = jest.fn().mockReturnValue({
        get: mockGet,
      });
      mockFirestoreInstance.collection.mockReturnValue({
        doc: mockDoc,
      } as any);

      const result = await authService.getUserData(uid);

      expect(result).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    const uid = 'test-uid';
    const updates = { displayName: 'Updated Name' };

    const mockCurrentUser = {
      updateProfile: jest.fn().mockResolvedValue(undefined),
    };

    it('ユーザープロフィールを更新できる', async () => {
      mockAuthInstance.currentUser = mockCurrentUser as any;

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn().mockReturnValue({
        update: mockUpdate,
      });
      mockFirestoreInstance.collection.mockReturnValue({
        doc: mockDoc,
      } as any);

      await authService.updateUserProfile(uid, updates);

      expect(mockCurrentUser.updateProfile).toHaveBeenCalledWith(updates);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('currentUserがnullの場合でもFirestoreは更新する', async () => {
      mockAuthInstance.currentUser = null;

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn().mockReturnValue({
        update: mockUpdate,
      });
      mockFirestoreInstance.collection.mockReturnValue({
        doc: mockDoc,
      } as any);

      await authService.updateUserProfile(uid, updates);

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('updateUserSettings', () => {
    const uid = 'test-uid';
    const settings = {
      pushNotificationsEnabled: false,
      notifyOnNewPost: false,
    };

    it('ユーザー設定を更新できる', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn().mockReturnValue({
        update: mockUpdate,
      });
      mockFirestoreInstance.collection.mockReturnValue({
        doc: mockDoc,
      } as any);

      await authService.updateUserSettings(uid, settings);

      expect(mockFirestoreInstance.collection).toHaveBeenCalledWith('users');
      expect(mockDoc).toHaveBeenCalledWith(uid);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
