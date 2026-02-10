// Note: @testing-library/react-native/extend-expect may not be available in all versions
// import '@testing-library/react-native/extend-expect';

jest.mock('@react-native-firebase/app', () => ({
  __esModule: true,
  default: () => ({
    onReady: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    currentUser: null,
  }),
}));

jest.mock('@react-native-firebase/firestore', () => {
  const mockDoc = {
    id: 'mockDocId',
    get: jest.fn().mockResolvedValue({
      exists: true,
      id: 'mockDocId',
      data: jest.fn().mockReturnValue({}),
    }),
    set: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn(),
  };

  const mockCollection = {
    doc: jest.fn(() => mockDoc),
    get: jest.fn().mockResolvedValue({
      empty: false,
      docs: [],
    }),
    add: jest.fn().mockResolvedValue(mockDoc),
    where: jest.fn(() => mockCollection),
    orderBy: jest.fn(() => mockCollection),
    limit: jest.fn(() => mockCollection),
  };

  mockDoc.collection.mockReturnValue(mockCollection);

  const mockFirestore = () => ({
    collection: jest.fn(() => mockCollection),
    doc: jest.fn(() => mockDoc),
    batch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),
  });

  mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
    increment: jest.fn((n) => `INCREMENT_${n}`),
    arrayUnion: jest.fn((val) => `ARRAY_UNION_${val}`),
    arrayRemove: jest.fn((val) => `ARRAY_REMOVE_${val}`),
  };

  mockFirestore.Timestamp = {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  };

  return {
    __esModule: true,
    default: mockFirestore,
  };
});

jest.mock('@react-native-firebase/storage', () => ({
  __esModule: true,
  default: () => ({
    ref: jest.fn(),
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
  getStringAsync: jest.fn().mockResolvedValue(''),
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn(),
    signOut: jest.fn(),
    isSignedIn: jest.fn().mockResolvedValue(false),
    getCurrentUser: jest.fn().mockResolvedValue(null),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));
