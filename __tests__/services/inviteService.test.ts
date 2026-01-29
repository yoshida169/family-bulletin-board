import { inviteService } from '@services/firebase/invite';

// Mock Firestore
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockWhere = jest.fn();

const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: mockWhere,
}));

jest.mock('@react-native-firebase/firestore', () => {
  const serverTimestamp = jest.fn(() => 'SERVER_TIMESTAMP');
  return {
    __esModule: true,
    default: jest.fn(() => ({
      collection: mockCollection,
      doc: mockDoc,
    })),
    FieldValue: {
      serverTimestamp,
      increment: jest.fn((n) => ({ _increment: n })),
      arrayUnion: jest.fn((val) => ({ _arrayUnion: val })),
    },
  };
});

describe('inviteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInviteCode', () => {
    it('should create a new invite code', async () => {
      mockSet.mockResolvedValueOnce(undefined);

      const input = {
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        expiresInDays: 7,
      };

      const result = await inviteService.createInviteCode(input);

      expect(mockSet).toHaveBeenCalled();
      expect(result.code).toBeDefined();
      expect(result.code).toHaveLength(8);
      expect(result.maxUses).toBe(10);
      expect(result.isActive).toBe(true);
    });
  });

  describe('validateInviteCode', () => {
    it('should return valid result for active code', async () => {
      const mockCodeData = {
        code: 'ABC12345',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) }, // Tomorrow
        createdAt: { toDate: () => new Date() },
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
        }),
      });

      const result = await inviteService.validateInviteCode('ABC12345');

      expect(result.isValid).toBe(true);
      expect(result.familyId).toBe('family-123');
    });

    it('should return invalid for non-existent code', async () => {
      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
      });

      const result = await inviteService.validateInviteCode('INVALID');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('無効な招待コードです');
    });

    it('should return invalid for expired code', async () => {
      const mockCodeData = {
        code: 'ABC12345',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() - 86400000) }, // Yesterday
        createdAt: { toDate: () => new Date() },
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
        }),
      });

      const result = await inviteService.validateInviteCode('ABC12345');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('招待コードの有効期限が切れています');
    });

    it('should return invalid for fully used code', async () => {
      const mockCodeData = {
        code: 'ABC12345',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 10,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
        createdAt: { toDate: () => new Date() },
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
        }),
      });

      const result = await inviteService.validateInviteCode('ABC12345');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('招待コードの使用上限に達しています');
    });

    it('should return invalid for inactive code', async () => {
      const mockCodeData = {
        code: 'ABC12345',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: false,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
        createdAt: { toDate: () => new Date() },
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ data: () => mockCodeData, id: 'code-doc-id' }],
        }),
      });

      const result = await inviteService.validateInviteCode('ABC12345');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('この招待コードは無効化されています');
    });
  });

  describe('useInviteCode', () => {
    it('should mark code as used by user', async () => {
      const mockCodeData = {
        code: 'ABC12345',
        familyId: 'family-123',
        createdBy: 'user-123',
        maxUses: 10,
        usedCount: 5,
        usedBy: [],
        isActive: true,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
        createdAt: { toDate: () => new Date() },
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              data: () => mockCodeData,
              id: 'code-doc-id',
              ref: { update: mockUpdate },
            },
          ],
        }),
      });

      mockUpdate.mockResolvedValueOnce(undefined);

      await inviteService.useInviteCode('ABC12345', 'user-456');

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deactivateInviteCode', () => {
    it('should deactivate an invite code', async () => {
      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          empty: false,
          docs: [{ id: 'code-doc-id', ref: { update: mockUpdate } }],
        }),
      });

      mockUpdate.mockResolvedValueOnce(undefined);

      await inviteService.deactivateInviteCode('ABC12345');

      expect(mockUpdate).toHaveBeenCalledWith({ isActive: false });
    });
  });

  describe('getActiveInviteCodes', () => {
    it('should return list of active invite codes for a family', async () => {
      const mockDocs = [
        {
          id: 'code-1',
          data: () => ({
            code: 'ABC12345',
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

      mockWhere.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: mockDocs }),
        }),
      });

      const result = await inviteService.getActiveInviteCodes('family-123');

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('ABC12345');
    });
  });
});
