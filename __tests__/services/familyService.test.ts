import { familyService } from '@services/firebase/family';
import firestore from '@react-native-firebase/firestore';

// Mock Firestore
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  where: mockWhere,
  orderBy: mockOrderBy,
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
    },
  };
});

describe('familyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createFamily', () => {
    it('should create a new family with correct data', async () => {
      const mockFamilyId = 'family-123';
      mockDoc.mockReturnValueOnce({ id: mockFamilyId });
      mockSet.mockResolvedValueOnce(undefined);

      const input = {
        name: 'テスト家族',
        description: 'テスト用の家族です',
        ownerId: 'user-123',
        ownerName: 'テストユーザー',
        ownerRelation: 'お父さん' as const,
      };

      const result = await familyService.createFamily(input);

      expect(mockCollection).toHaveBeenCalledWith('families');
      expect(mockSet).toHaveBeenCalled();
      expect(result.id).toBe(mockFamilyId);
      expect(result.name).toBe(input.name);
      expect(result.ownerId).toBe(input.ownerId);
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

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => mockFamilyData,
        id: 'family-123',
      });

      const result = await familyService.getFamily('family-123');

      expect(mockCollection).toHaveBeenCalledWith('families');
      expect(mockDoc).toHaveBeenCalledWith('family-123');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('テスト家族');
    });

    it('should return null if family does not exist', async () => {
      mockGet.mockResolvedValueOnce({
        exists: false,
      });

      const result = await familyService.getFamily('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateFamily', () => {
    it('should update family with provided data', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await familyService.updateFamily('family-123', {
        name: '更新された家族名',
        description: '更新された説明',
      });

      expect(mockCollection).toHaveBeenCalledWith('families');
      expect(mockDoc).toHaveBeenCalledWith('family-123');
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteFamily', () => {
    it('should delete the family', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await familyService.deleteFamily('family-123');

      expect(mockCollection).toHaveBeenCalledWith('families');
      expect(mockDoc).toHaveBeenCalledWith('family-123');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('getUserFamilies', () => {
    it('should return list of families user belongs to', async () => {
      const mockDocs = [
        {
          id: 'relation-1',
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
      ];

      mockWhere.mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({ docs: mockDocs }),
        }),
      });

      const result = await familyService.getUserFamilies('user-123');

      expect(mockCollection).toHaveBeenCalledWith('userFamilies');
      expect(result).toHaveLength(1);
      expect(result[0].familyName).toBe('家族1');
    });
  });
});
