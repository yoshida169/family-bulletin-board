const mockAuthInstance = {
  currentUser: null as any,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  onAuthStateChanged: jest.fn((callback: any) => {
    // デフォルトでは何もしない
    return jest.fn(); // unsubscribe関数
  }),
};

export { mockAuthInstance };
export default () => mockAuthInstance;
