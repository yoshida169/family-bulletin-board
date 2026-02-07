import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Collections } from './config';
import type { User, UserSettings, LoginCredentials, SignUpCredentials } from '@/src/types/auth';

const defaultSettings: UserSettings = {
  pushNotificationsEnabled: true,
  notifyOnNewPost: true,
  notifyOnComment: true,
  notifyOnMention: true,
};

export const authService = {
  getCurrentUser: (): FirebaseAuthTypes.User | null => {
    return auth().currentUser;
  },

  onAuthStateChanged: (callback: (user: FirebaseAuthTypes.User | null) => void) => {
    return auth().onAuthStateChanged(callback);
  },

  signInWithEmail: async ({ email, password }: LoginCredentials): Promise<User> => {
    const credential = await auth().signInWithEmailAndPassword(email, password);
    const user = credential.user;

    await firestore()
      .collection(Collections.USERS)
      .doc(user.uid)
      .update({
        lastLoginAt: firestore.FieldValue.serverTimestamp(),
      });

    const userDoc = await firestore()
      .collection(Collections.USERS)
      .doc(user.uid)
      .get();

    return userDoc.data() as User;
  },

  signUpWithEmail: async ({
    email,
    password,
    displayName,
  }: SignUpCredentials): Promise<User> => {
    const credential = await auth().createUserWithEmailAndPassword(email, password);
    const user = credential.user;

    await user.updateProfile({ displayName });

    const now = firestore.FieldValue.serverTimestamp();
    const userData: Omit<User, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
      createdAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
      updatedAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
      lastLoginAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
    } = {
      uid: user.uid,
      email: email,
      displayName: displayName,
      photoURL: null,
      authProvider: 'email',
      settings: defaultSettings,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
      isDeleted: false,
      deletedAt: null,
      scheduledDeletionAt: null,
    };

    await firestore()
      .collection(Collections.USERS)
      .doc(user.uid)
      .set(userData);

    return {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    } as User;
  },

  signOut: async (): Promise<void> => {
    await auth().signOut();
  },

  sendPasswordResetEmail: async (email: string): Promise<void> => {
    await auth().sendPasswordResetEmail(email);
  },

  getUserData: async (uid: string): Promise<User | null> => {
    const doc = await firestore()
      .collection(Collections.USERS)
      .doc(uid)
      .get();

    if (!doc.exists) return null;

    const data = doc.data();
    return {
      ...data,
      createdAt: data?.createdAt?.toDate() ?? new Date(),
      updatedAt: data?.updatedAt?.toDate() ?? new Date(),
      lastLoginAt: data?.lastLoginAt?.toDate() ?? new Date(),
      deletedAt: data?.deletedAt?.toDate() ?? null,
      scheduledDeletionAt: data?.scheduledDeletionAt?.toDate() ?? null,
    } as User;
  },

  updateUserProfile: async (
    uid: string,
    updates: Partial<Pick<User, 'displayName' | 'photoURL'>>
  ): Promise<void> => {
    const currentUser = auth().currentUser;
    if (currentUser) {
      await currentUser.updateProfile(updates);
    }

    await firestore()
      .collection(Collections.USERS)
      .doc(uid)
      .update({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  },

  updateUserSettings: async (
    uid: string,
    settings: Partial<UserSettings>
  ): Promise<void> => {
    await firestore()
      .collection(Collections.USERS)
      .doc(uid)
      .update({
        settings: settings,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
  },
};
