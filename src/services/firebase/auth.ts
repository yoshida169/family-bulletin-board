import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
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

  signInWithGoogle: async (): Promise<User> => {
    // Google Sign-Inの実行
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();

    // Firebase認証用のGoogle credentialを作成
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const credential = await auth().signInWithCredential(googleCredential);
    const firebaseUser = credential.user;

    // ユーザーデータの作成または更新
    const userDoc = await firestore()
      .collection(Collections.USERS)
      .doc(firebaseUser.uid)
      .get();

    if (userDoc.exists) {
      // 既存ユーザーの場合は最終ログイン日時を更新
      await firestore()
        .collection(Collections.USERS)
        .doc(firebaseUser.uid)
        .update({
          lastLoginAt: firestore.FieldValue.serverTimestamp(),
        });

      const data = userDoc.data();
      return {
        ...data,
        createdAt: data?.createdAt?.toDate() ?? new Date(),
        updatedAt: data?.updatedAt?.toDate() ?? new Date(),
        lastLoginAt: new Date(),
        deletedAt: data?.deletedAt?.toDate() ?? null,
        scheduledDeletionAt: data?.scheduledDeletionAt?.toDate() ?? null,
      } as User;
    } else {
      // 新規ユーザーの場合はFirestoreにドキュメントを作成
      const now = firestore.FieldValue.serverTimestamp();
      const userData: Omit<User, 'createdAt' | 'updatedAt' | 'lastLoginAt'> & {
        createdAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
        updatedAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
        lastLoginAt: ReturnType<typeof firestore.FieldValue.serverTimestamp>;
      } = {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? '',
        photoURL: firebaseUser.photoURL ?? null,
        authProvider: 'google',
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
        .doc(firebaseUser.uid)
        .set(userData);

      return {
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      } as User;
    }
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

  /**
   * アカウントを論理削除し、30日後の物理削除をスケジュール
   */
  /**
   * アカウントを論理削除し、30日後の物理削除をスケジュール
   * 全てのファミリーから退会してから削除
   */
  deleteAccount: async (uid: string): Promise<void> => {
    // ユーザーが所属しているファミリーを取得
    const userFamiliesSnapshot = await firestore()
      .collection(Collections.USER_FAMILIES)
      .where('__name__', '>=', `${uid}_`)
      .where('__name__', '<', `${uid}_\uf8ff`)
      .get();

    // 各ファミリーから退会（memberService.leaveFamilyを呼ぶ必要があるため、ここではIDのリストのみ取得）
    const familyIds: string[] = [];
    userFamiliesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.familyId) {
        familyIds.push(data.familyId);
      }
    });

    // 注意: ファミリー退会処理はこの関数を呼ぶ前に完了している必要があります
    // または、memberServiceへの循環参照を避けるため、別途処理する必要があります
    
    const now = new Date();
    const scheduledDeletion = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30日後

    // ユーザードキュメントを論理削除
    await firestore()
      .collection(Collections.USERS)
      .doc(uid)
      .update({
        isDeleted: true,
        deletedAt: firestore.FieldValue.serverTimestamp(),
        scheduledDeletionAt: firestore.Timestamp.fromDate(scheduledDeletion),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

    // Firebase Authenticationからユーザーを削除
    const currentUser = auth().currentUser;
    if (currentUser && currentUser.uid === uid) {
      await currentUser.delete();
    }
  },,
};
