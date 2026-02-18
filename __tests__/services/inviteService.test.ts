import { invitationService as inviteService } from '@services/firebase/invitation';
import firestore from '@react-native-firebase/firestore';
import { memberService } from '@services/firebase/member';

// Mock memberService
jest.mock('@services/firebase/member', () => ({
  memberService: {
    addMember: jest.fn(),
  },
}));

// Create comprehensive mocks
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
});

// Create chainable query mock
const createMockQueryRef = () => {
  const queryRef: any = {
    where: jest.fn(),
    limit: jest.fn(),
    orderBy: jest.fn(),
    get: jest.fn(),
  };

  // Make methods chainable
  queryRef.where.mockReturnValue(queryRef);
  queryRef.limit.mockReturnValue(queryRef);
  queryRef.orderBy.mockReturnValue(queryRef);

  return queryRef;
};

const createMockCollectionRef = () => ({
  doc: jest.fn(),
  get: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
});

const mockFirestoreInstance = {
  collection: jest.fn(),
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

const mockMemberService = memberService as jest.Mocked<typeof memberService>;

describe('inviteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    mockSet.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
    mockFirestoreInstance.collection.mockReset();
    mockMemberService.addMember.mockReset();
  });

  describe('createInviteCode', () => {
    it('should create a new invite code', async () => {
      // Setup invite code doc
      const inviteCodeDocRef = createMockDocRef('invite-123');

      // Setup invite codes collection
      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.doc.mockReturnValue(inviteCodeDocRef);

      // Setup query for uniqueness check
      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({
        empty: true,
        docs: [],
      });
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection
        .mockReturnValueOnce(inviteCodesCollectionRef) // For uniqueness check
        .mockReturnValueOnce(inviteCodesCollectionRef); // For creating invite code

      mockSet.mockResolvedValue(undefined);

      const input = {
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
      };

      const result = await inviteService.createInviteCode(input);

      expect(mockSet).toHaveBeenCalled();
      expect(result.code).toBeDefined();
      expect(result.code).toHaveLength(6);
      expect(result.maxUses).toBe(10);
      expect(result.isActive).toBe(true);
    });
  });

  describe('validateInviteCode', () => {
    it('should return valid result for active code', async () => {
      const mockCodeData = {
        code: 'ABC123',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) }, // Tomorrow
        createdAt: { toDate: () => new Date() },
      };

      // Setup query for getInviteCodeByCode
      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
      });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);

      const result = await inviteService.validateInviteCode('ABC123');

      expect(result.isValid).toBe(true);
      expect(result.familyId).toBe('family-123');
    });

    it('should return invalid for non-existent code', async () => {
      // Setup query for getInviteCodeByCode
      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({ empty: true, docs: [] });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);

      const result = await inviteService.validateInviteCode('INVALID');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('無効な招待コードです');
    });

    it('should return invalid for expired code', async () => {
      const mockCodeData = {
        code: 'ABC123',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() - 86400000) }, // Yesterday
        createdAt: { toDate: () => new Date() },
      };

      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
      });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);

      const result = await inviteService.validateInviteCode('ABC123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('招待コードの有効期限が切れています');
    });

    it('should return invalid for fully used code', async () => {
      const mockCodeData = {
        code: 'ABC123',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 10,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
        createdAt: { toDate: () => new Date() },
      };

      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
      });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);

      const result = await inviteService.validateInviteCode('ABC123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('招待コードの使用上限に達しています');
    });

    it('should return invalid for inactive code', async () => {
      const mockCodeData = {
        code: 'ABC123',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: false,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
        createdAt: { toDate: () => new Date() },
      };

      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
      });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);

      const result = await inviteService.validateInviteCode('ABC123');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('この招待コードは無効化されています');
    });
  });

  describe('useInviteCode', () => {
    it('should mark code as used by user', async () => {
      const mockCodeData = {
        code: 'ABC123',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
        createdAt: { toDate: () => new Date() },
      };

      // Setup query for getInviteCodeByCode
      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({
        empty: false,
        docs: [
          {
            data: () => mockCodeData,
            id: 'code-doc-id',
          },
        ],
      });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      // Setup doc for update
      const inviteCodeDocRef = createMockDocRef('code-doc-id');
      inviteCodesCollectionRef.doc.mockReturnValue(inviteCodeDocRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);

      // Mock memberService.addMember
      mockMemberService.addMember.mockResolvedValue({
        userId: 'user-456',
        displayName: 'Test User',
        photoURL: null,
        relation: 'その他',
        role: 'child',
        invitedBy: 'user-123',
        joinedAt: new Date(),
      });

      mockUpdate.mockResolvedValue(undefined);

      await inviteService.useInviteCode('ABC123', 'user-456', 'Test User');

      expect(mockMemberService.addMember).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deactivateInviteCode', () => {
    it('should deactivate an invite code', async () => {
      const mockDocRef = createMockDocRef('code-doc-id');

      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({
        empty: false,
        docs: [{ id: 'code-doc-id', ref: mockDocRef }],
      });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);
      mockUpdate.mockResolvedValue(undefined);

      await inviteService.deactivateInviteCode('ABC123');

      expect(mockUpdate).toHaveBeenCalledWith({ isActive: false });
    });
  });

  describe('getActiveInviteCodes', () => {
    it('should return list of active invite codes for a family', async () => {
      const mockDocs = [
        {
          id: 'code-1',
          data: () => ({
            code: 'ABC123',
            familyId: 'family-123',
            createdBy: 'user-123',
            maxUses: 10,
            usedCount: 5,
            usedBy: [],
            isActive: true,
            expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
            createdAt: { toDate: () => new Date() },
          }),
        },
      ];

      // Create chainable query for where().where().get()
      const queryRef = createMockQueryRef();
      queryRef.get.mockResolvedValue({ docs: mockDocs });

      const inviteCodesCollectionRef = createMockCollectionRef();
      inviteCodesCollectionRef.where.mockReturnValue(queryRef);

      mockFirestoreInstance.collection.mockReturnValue(inviteCodesCollectionRef);

      const result = await inviteService.getActiveInviteCodes('family-123');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('ABC123');
    });
  });
});
