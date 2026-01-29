export type AuthProvider = 'email' | 'google' | 'instagram' | 'x';

export interface UserSettings {
  pushNotificationsEnabled: boolean;
  notifyOnNewPost: boolean;
  notifyOnComment: boolean;
  notifyOnMention: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  authProvider: AuthProvider;
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
  scheduledDeletionAt: Date | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}
