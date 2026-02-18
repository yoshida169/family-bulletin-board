import { familyService } from '@services/firebase/family';
import firestore from '@react-native-firebase/firestore';

// Create comprehensive mocks
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockBatchSet = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchDelete = jest.fn();

const mockBatch = {
  set: mockBatchSet,
  update: mockBatchUpdate,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
};

const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const createMockDocRef = (id: string = 'mock-doc-id') => ({
  id,
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
  collection: jest.fn(),
});

const createMockCollectionRef = () => ({
  doc: jest.fn(),
  get: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
});

const mockFirestoreInstance = {
  collection: jest.fn(),
  batch: jest.fn(() => mockBatch),
};

// Mock the firestore module
jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = jest.fn(() => mockFirestoreInstance);

  mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((n) => n),
    arrayUnion: jest.fn((val) => [val]),
    arrayRemove: jest.fn((val) => []),
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

describe('familyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    mockSet.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockBatchSet.mockReset();
    mockBatchUpdate.mockReset();
    mockBatchDelete.mockReset();
    mockBatchCommit.mockReset().mockResolvedValue(undefined);
    mockFirestoreInstance.collection.mockReset();
    mockFirestoreInstance.batch.mockReset().mockReturnValue(mockBatch);
  });

  describe('createFamily', () => {
    it('should create a new family with correct data', async () => {
      const mockFamilyId = 'family-123';

      // Create member doc
      const memberDocRef = createMockDocRef('member-123');

      // Create member collection for the family doc's subcollection
      const memberCollectionRef = createMockCollectionRef();
      memberCollectionRef.doc.mockReturnValue(memberDocRef);

      // Create family doc with collection method that returns member collection
      const familyDocRef = createMockDocRef(mockFamilyId);
      familyDocRef.collection.mockReturnValue(memberCollectionRef);

      // Create family collection that returns family doc
      const familyCollectionRef = createMockCollectionRef();
      familyCollectionRef.doc.mockImplementation((id) => {
        if (id === undefined || id === mockFamilyId) {
          return familyDocRef;
        }
        return familyDocRef;
      });

      // Create userFamilies doc
      const userFamilyDocRef = createMockDocRef('userFamily-123');

      // Create userFamilies collection
      const userFamilyCollectionRef = createMockCollectionRef();
      userFamilyCollectionRef.doc.mockReturnValue(userFamilyDocRef);

      // Setup firestore collection calls in order:
      // 1. firestore().collection('families').doc() - for creating family doc
      // 2. firestore().collection('families').doc().collection('members').doc() - for adding member
      // 3. firestore().collection('userFamilies').doc() - for adding user family relation
      mockFirestoreInstance.collection
        .mockReturnValueOnce(familyCollectionRef)      // 1st call: families (for creating family doc)
        .mockReturnValueOnce(familyCollectionRef)      // 2nd call: families (for adding member)
        .mockReturnValueOnce(userFamilyCollectionRef); // 3rd call: userFamilies

      mockSet.mockResolvedValue(undefined);

      const input = {
        name: 'テスト家族',
        description: 'テスト用の家族です',
        ownerId: 'user-123',
        ownerName: 'テストユーザー',
        ownerRelation: 'お父さん' as const,
      };

      const result = await familyService.createFamily(input);

      expect(result.id).toBe(mockFamilyId);
      expect(result.name).toBe(input.name);
      expect(result.ownerId).toBe(input.ownerId);
      expect(mockSet).toHaveBeenCalledTimes(3); // family, member, userFamily
    });
  });

  describe('getFamily', () => {
    it('should return family data if exists', async () => {
      const mockFamilyData = {
        id: 'family-123',
        name: 'テスト家族',
        description: null,
        iconURL: null,
        ownerId: 'user-123',
        adminIds: ['user-123'],
        memberCount: 1,
        postCount: 0,
        settings: {
          allowChildrenToPost: true,
          allowChildrenToComment: true,
          requireApprovalForPosts: false,
        },
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      };

      const docRef = createMockDocRef('family-123');
      const collectionRef = createMockCollectionRef();
      collectionRef.doc.mockReturnValue(docRef);
      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => mockFamilyData,
        id: 'family-123',
      });

      const result = await familyService.getFamily('family-123');

      expect(result).not.toBeNull();
      expect(result?.name).toBe('テスト家族');
    });

    it('should return null if family does not exist', async () => {
      const docRef = createMockDocRef('nonexistent');
      const collectionRef = createMockCollectionRef();
      collectionRef.doc.mockReturnValue(docRef);
      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      mockGet.mockResolvedValueOnce({
        exists: false,
      });

      const result = await familyService.getFamily('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateFamily', () => {
    it('should update family with provided data', async () => {
      const docRef = createMockDocRef('family-123');
      const collectionRef = createMockCollectionRef();
      collectionRef.doc.mockReturnValue(docRef);
      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      mockUpdate.mockResolvedValueOnce(undefined);

      await familyService.updateFamily('family-123', {
        description: '更新された説明',
      });

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should update family name and propagate to userFamilies', async () => {
      // Setup members subcollection
      const memberDocs = [
        { id: 'user-1', data: () => ({}) },
        { id: 'user-2', data: () => ({}) },
      ];
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.get.mockResolvedValue({ docs: memberDocs });

      // Setup family doc with collection method
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup family collection
      const familyCollectionRef = createMockCollectionRef();
      familyCollectionRef.doc.mockReturnValue(familyDocRef);

      // Setup userFamilies collection for batch updates
      const userFamilyCollectionRef = createMockCollectionRef();
      const userFamilyDocRef1 = createMockDocRef('user-1_family-123');
      const userFamilyDocRef2 = createMockDocRef('user-2_family-123');
      userFamilyCollectionRef.doc
        .mockReturnValueOnce(userFamilyDocRef1)
        .mockReturnValueOnce(userFamilyDocRef2);

      mockFirestoreInstance.collection
        .mockReturnValueOnce(familyCollectionRef)     // families collection for update
        .mockReturnValueOnce(familyCollectionRef)     // families collection for getting members
        .mockReturnValueOnce(userFamilyCollectionRef) // userFamilies for user-1
        .mockReturnValueOnce(userFamilyCollectionRef); // userFamilies for user-2

      mockUpdate.mockResolvedValue(undefined);
      mockBatchCommit.mockResolvedValue(undefined);

      await familyService.updateFamily('family-123', {
        name: '更新された家族名',
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(mockBatchUpdate).toHaveBeenCalledTimes(2); // Update for each member
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('deleteFamily', () => {
    it('should delete the family and all related data', async () => {
      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      const familyCollectionRef = createMockCollectionRef();
      familyCollectionRef.doc.mockReturnValue(familyDocRef);

      // Setup members subcollection
      const memberDocs = [
        { id: 'user-1', ref: createMockDocRef('user-1') },
        { id: 'user-2', ref: createMockDocRef('user-2') },
      ];
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.get.mockResolvedValue({ docs: memberDocs });
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup userFamilies collection
      const userFamilyCollectionRef = createMockCollectionRef();
      const userFamilyDocRef1 = createMockDocRef('user-1_family-123');
      const userFamilyDocRef2 = createMockDocRef('user-2_family-123');
      userFamilyCollectionRef.doc
        .mockReturnValueOnce(userFamilyDocRef1)
        .mockReturnValueOnce(userFamilyDocRef2);

      mockFirestoreInstance.collection
        .mockReturnValueOnce(familyCollectionRef) // families collection
        .mockReturnValueOnce(membersCollectionRef) // members subcollection
        .mockReturnValueOnce(userFamilyCollectionRef) // userFamilies for user-1
        .mockReturnValueOnce(userFamilyCollectionRef) // userFamilies for user-2
        .mockReturnValueOnce(familyCollectionRef); // families for final delete

      mockBatchCommit.mockResolvedValue(undefined);

      await familyService.deleteFamily('family-123');

      expect(mockBatchDelete).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('getUserFamilies', () => {
    it('should return list of families user belongs to', async () => {
      const mockDocs = [
        {
          id: 'user-123_family-1',
          data: () => ({
            familyId: 'family-1',
            familyName: '家族1',
            familyIconURL: null,
            role: 'admin',
            relation: 'お父さん',
            joinedAt: { toDate: () => new Date('2024-01-01') },
            lastViewedAt: { toDate: () => new Date('2024-01-01') },
            unreadPostCount: 0,
          }),
        },
        {
          id: 'user-456_family-2', // Different user, should be filtered out
          data: () => ({
            familyId: 'family-2',
            familyName: '家族2',
            familyIconURL: null,
            role: 'member',
            relation: 'お母さん',
            joinedAt: { toDate: () => new Date('2024-01-02') },
            lastViewedAt: { toDate: () => new Date('2024-01-02') },
            unreadPostCount: 1,
          }),
        },
      ];

      const collectionRef = createMockCollectionRef();
      const queryRef = {
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: mockDocs }),
      };
      collectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      const result = await familyService.getUserFamilies('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].familyName).toBe('家族1');
      expect(result[0].familyId).toBe('family-1');
    });

    it('should return empty array if user has no families', async () => {
      const collectionRef = createMockCollectionRef();
      const queryRef = {
        orderBy: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      };
      collectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      const result = await familyService.getUserFamilies('user-123');

      expect(result).toHaveLength(0);
    });
  });

  describe('isUserAdmin', () => {
    it('should return true if user is admin', async () => {
      const docRef = createMockDocRef('family-123');
      const collectionRef = createMockCollectionRef();
      collectionRef.doc.mockReturnValue(docRef);
      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          adminIds: ['user-123', 'user-456'],
        }),
      });

      const result = await familyService.isUserAdmin('family-123', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false if user is not admin', async () => {
      const docRef = createMockDocRef('family-123');
      const collectionRef = createMockCollectionRef();
      collectionRef.doc.mockReturnValue(docRef);
      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          adminIds: ['user-456'],
        }),
      });

      const result = await familyService.isUserAdmin('family-123', 'user-123');

      expect(result).toBe(false);
    });
  });

  describe('isUserOwner', () => {
    it('should return true if user is owner', async () => {
      const docRef = createMockDocRef('family-123');
      const collectionRef = createMockCollectionRef();
      collectionRef.doc.mockReturnValue(docRef);
      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          ownerId: 'user-123',
        }),
      });

      const result = await familyService.isUserOwner('family-123', 'user-123');

      expect(result).toBe(true);
    });

    it('should return false if user is not owner', async () => {
      const docRef = createMockDocRef('family-123');
      const collectionRef = createMockCollectionRef();
      collectionRef.doc.mockReturnValue(docRef);
      mockFirestoreInstance.collection.mockReturnValue(collectionRef);

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          ownerId: 'user-456',
        }),
      });

      const result = await familyService.isUserOwner('family-123', 'user-123');

      expect(result).toBe(false);
    });
  });
});
