const mockFirestoreInstance = {
  collection: jest.fn(),
};

const mockFieldValue = {
  serverTimestamp: jest.fn(),
  arrayUnion: jest.fn(),
  arrayRemove: jest.fn(),
  increment: jest.fn(),
  delete: jest.fn(),
};

const mockFirestore: any = () => mockFirestoreInstance;
mockFirestore.FieldValue = mockFieldValue;

export { mockFirestoreInstance };
export default mockFirestore;
