import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export { firebase, auth, firestore, storage };

export const Collections = {
  USERS: 'users',
  FAMILIES: 'families',
  USER_FAMILIES: 'userFamilies',
  MEMBERS: 'members',
  POSTS: 'posts',
  COMMENTS: 'comments',
  READ_BY: 'readBy',
  INVITE_CODES: 'inviteCodes',
  FCM_TOKENS: 'fcmTokens',
} as const;
