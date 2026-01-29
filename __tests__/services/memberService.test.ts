import { memberService } from '@services/firebase/member';

// Mock Firestore
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockDoc = jest.fn(() => ({
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  get: mockGet,
}));

jest.mock('@react-native-firebase/firestore', () => {
  const serverTimestamp = jest.fn(() => 'SERVER_TIMESTAMP');
  return {
    __esModule: true,
    default: jest.fn(() => ({
      collection: mockCollection,
      doc: mockDoc,
      batch: jest.fn(() => ({
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      })),
    })),
    FieldValue: {
      serverTimestamp,
      increment: jest.fn((n) => ({ _increment: n })),
    },
  };
});

describe('memberService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addMember', () => {
    it('should add a new member to the family', async () => {
      mockGet.mockResolvedValueOnce({ exists: false });
      mockSet.mockResolvedValueOnce(undefined);

      const input = {
        familyId: 'family-123',
        userId: 'user-456',
        displayName: 'テストメンバー',
        photoURL: null,
        relation: 'お母さん' as const,
        role: 'member' as const,
        invitedBy: 'user-123',
      };

      await memberService.addMember(input);

      expect(mockSet).toHaveBeenCalled();
    });

    it('should throw error if member already exists', async () => {
      mockGet.mockResolvedValueOnce({ exists: true });

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
      mockDelete.mockResolvedValueOnce(undefined);

      await memberService.removeMember('family-123', 'user-456');

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await memberService.updateMemberRole('family-123', 'user-456', 'admin');

      expect(mockUpdate).toHaveBeenCalled();
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

      mockGet.mockResolvedValueOnce({ docs: mockDocs });

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

      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => mockMemberData,
      });

      const result = await memberService.getMember('family-123', 'user-123');

      expect(result).not.toBeNull();
      expect(result?.displayName).toBe('お父さん');
    });

    it('should return null if member does not exist', async () => {
      mockGet.mockResolvedValueOnce({ exists: false });

      const result = await memberService.getMember('family-123', 'nonexistent');

      expect(result).toBeNull();
    });
  });
});
