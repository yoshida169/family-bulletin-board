import { memberService } from '@services/firebase/member';
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

describe('memberService', () => {
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

  describe('addMember', () => {
    it('should add a new member to the family', async () => {
      // Setup member doc
      const memberDocRef = createMockDocRef('user-456');
      mockGet.mockResolvedValueOnce({ exists: () => false }); // Member doesn't exist

      // Setup members collection
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.doc.mockReturnValue(memberDocRef);

      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup families collection
      const familiesCollectionRef = createMockCollectionRef();
      familiesCollectionRef.doc.mockReturnValue(familyDocRef);

      // Setup userFamilies doc
      const userFamilyDocRef = createMockDocRef('user-456_family-123');

      // Setup userFamilies collection
      const userFamiliesCollectionRef = createMockCollectionRef();
      userFamiliesCollectionRef.doc.mockReturnValue(userFamilyDocRef);

      mockFirestoreInstance.collection
        .mockReturnValueOnce(familiesCollectionRef)     // families collection
        .mockReturnValueOnce(familiesCollectionRef)     // families collection for update
        .mockReturnValueOnce(userFamiliesCollectionRef); // userFamilies collection

      const input = {
        familyId: 'family-123',
        userId: 'user-456',
        displayName: 'テストメンバー',
        photoURL: null,
        relation: 'お母さん' as const,
        role: 'member' as const,
        invitedBy: 'user-123',
        familyName: 'テスト家族',
      };

      await memberService.addMember(input);

      expect(mockGet).toHaveBeenCalled(); // Check existence
      expect(mockBatchSet).toHaveBeenCalled(); // Add member and userFamily
      expect(mockBatchUpdate).toHaveBeenCalled(); // Update family
      expect(mockBatchCommit).toHaveBeenCalled();
    });

    it('should throw error if member already exists', async () => {
      // Setup member doc that exists
      const memberDocRef = createMockDocRef('user-456');
      mockGet.mockResolvedValueOnce({ exists: () => true });

      // Setup members collection
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.doc.mockReturnValue(memberDocRef);

      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup families collection
      const familiesCollectionRef = createMockCollectionRef();
      familiesCollectionRef.doc.mockReturnValue(familyDocRef);

      mockFirestoreInstance.collection.mockReturnValue(familiesCollectionRef);

      const input = {
        familyId: 'family-123',
        userId: 'user-456',
        displayName: 'テストメンバー',
        photoURL: null,
        relation: 'お母さん' as const,
        role: 'member' as const,
        invitedBy: 'user-123',
      };

      await expect(memberService.addMember(input)).rejects.toThrow(
        'このユーザーは既にファミリーのメンバーです'
      );
    });
  });

  describe('removeMember', () => {
    it('should remove a member from the family', async () => {
      // Setup member doc
      const memberDocRef = createMockDocRef('user-456');

      // Setup members collection
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.doc.mockReturnValue(memberDocRef);

      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup families collection
      const familiesCollectionRef = createMockCollectionRef();
      familiesCollectionRef.doc.mockReturnValue(familyDocRef);

      // Setup userFamilies doc
      const userFamilyDocRef = createMockDocRef('user-456_family-123');

      // Setup userFamilies collection
      const userFamiliesCollectionRef = createMockCollectionRef();
      userFamiliesCollectionRef.doc.mockReturnValue(userFamilyDocRef);

      mockFirestoreInstance.collection
        .mockReturnValueOnce(familiesCollectionRef)     // families collection
        .mockReturnValueOnce(familiesCollectionRef)     // families collection for update
        .mockReturnValueOnce(userFamiliesCollectionRef); // userFamilies collection

      await memberService.removeMember('family-123', 'user-456');

      expect(mockBatchDelete).toHaveBeenCalledTimes(2); // member and userFamily
      expect(mockBatchUpdate).toHaveBeenCalled(); // Update family
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role to admin', async () => {
      // Setup member doc
      const memberDocRef = createMockDocRef('user-456');

      // Setup members collection
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.doc.mockReturnValue(memberDocRef);

      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup families collection
      const familiesCollectionRef = createMockCollectionRef();
      familiesCollectionRef.doc.mockReturnValue(familyDocRef);

      // Setup userFamilies doc
      const userFamilyDocRef = createMockDocRef('user-456_family-123');

      // Setup userFamilies collection
      const userFamiliesCollectionRef = createMockCollectionRef();
      userFamiliesCollectionRef.doc.mockReturnValue(userFamilyDocRef);

      mockFirestoreInstance.collection
        .mockReturnValueOnce(familiesCollectionRef)     // families collection
        .mockReturnValueOnce(familiesCollectionRef)     // families collection for adminIds update
        .mockReturnValueOnce(userFamiliesCollectionRef); // userFamilies collection

      await memberService.updateMemberRole('family-123', 'user-456', 'admin');

      expect(mockBatchUpdate).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });

  describe('getFamilyMembers', () => {
    it('should return list of family members', async () => {
      const mockDocs = [
        {
          id: 'user-123',
          data: () => ({
            userId: 'user-123',
            displayName: 'お父さん',
            photoURL: null,
            relation: 'お父さん',
            role: 'admin',
            joinedAt: { toDate: () => new Date('2024-01-01') },
            invitedBy: null,
          }),
        },
        {
          id: 'user-456',
          data: () => ({
            userId: 'user-456',
            displayName: 'お母さん',
            photoURL: null,
            relation: 'お母さん',
            role: 'member',
            joinedAt: { toDate: () => new Date('2024-01-02') },
            invitedBy: 'user-123',
          }),
        },
      ];

      // Setup members collection
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.get.mockResolvedValue({ docs: mockDocs });

      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup families collection
      const familiesCollectionRef = createMockCollectionRef();
      familiesCollectionRef.doc.mockReturnValue(familyDocRef);

      mockFirestoreInstance.collection.mockReturnValue(familiesCollectionRef);

      const result = await memberService.getFamilyMembers('family-123');

      expect(result).toHaveLength(2);
      expect(result[0].displayName).toBe('お父さん');
      expect(result[1].displayName).toBe('お母さん');
    });
  });

  describe('getMember', () => {
    it('should return a specific member', async () => {
      const mockMemberData = {
        userId: 'user-123',
        displayName: 'お父さん',
        photoURL: null,
        relation: 'お父さん',
        role: 'admin',
        joinedAt: { toDate: () => new Date('2024-01-01') },
        invitedBy: null,
      };

      // Setup member doc
      const memberDocRef = createMockDocRef('user-123');
      mockGet.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockMemberData,
      });

      // Setup members collection
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.doc.mockReturnValue(memberDocRef);

      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup families collection
      const familiesCollectionRef = createMockCollectionRef();
      familiesCollectionRef.doc.mockReturnValue(familyDocRef);

      mockFirestoreInstance.collection.mockReturnValue(familiesCollectionRef);

      const result = await memberService.getMember('family-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.displayName).toBe('お父さん');
    });

    it('should return null if member does not exist', async () => {
      // Setup member doc
      const memberDocRef = createMockDocRef('nonexistent');
      mockGet.mockResolvedValueOnce({ exists: () => false });

      // Setup members collection
      const membersCollectionRef = createMockCollectionRef();
      membersCollectionRef.doc.mockReturnValue(memberDocRef);

      // Setup family doc
      const familyDocRef = createMockDocRef('family-123');
      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      // Setup families collection
      const familiesCollectionRef = createMockCollectionRef();
      familiesCollectionRef.doc.mockReturnValue(familyDocRef);

      mockFirestoreInstance.collection.mockReturnValue(familiesCollectionRef);

      const result = await memberService.getMember('family-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });
});
