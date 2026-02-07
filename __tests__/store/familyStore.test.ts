import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFamilyStore } from '@/src/store/familyStore';
import { familyService } from '@services/firebase/family';
import { memberService } from '@services/firebase/member';

// Mock services
jest.mock('@services/firebase/family');
jest.mock('@services/firebase/member');

const mockFamilyService = familyService as jest.Mocked<typeof familyService>;
const mockMemberService = memberService as jest.Mocked<typeof memberService>;

describe('familyStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    const { result } = renderHook(() => useFamilyStore());
    act(() => {
      result.current.clearError();
      result.current.setFamilies([]);
      result.current.setCurrentFamily(null);
      result.current.setMembers([]);
    });
  });

  describe('loadUserFamilies', () => {
    it('should load user families successfully', async () => {
      const mockFamilies = [
        {
          familyId: 'family-1',
          familyName: '家族1',
          familyIconURL: null,
          role: 'admin' as const,
          relation: 'お父さん' as const,
          joinedAt: new Date(),
          lastViewedAt: new Date(),
          unreadPostCount: 0,
        },
      ];

      mockFamilyService.getUserFamilies.mockResolvedValue(mockFamilies);

      const { result } = renderHook(() => useFamilyStore());

      await act(async () => {
        await result.current.loadUserFamilies('user-123');
      });

      expect(result.current.families).toEqual(mockFamilies);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set error on failure', async () => {
      mockFamilyService.getUserFamilies.mockRejectedValue(
        new Error('Failed to load families')
      );

      const { result } = renderHook(() => useFamilyStore());

      await act(async () => {
        try {
          await result.current.loadUserFamilies('user-123');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Failed to load families');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('selectFamily', () => {
    it('should select family and load members', async () => {
      const mockFamily = {
        id: 'family-1',
        name: '家族1',
        description: null,
        iconURL: null,
        ownerId: 'user-123',
        adminIds: ['user-123'],
        memberCount: 2,
        postCount: 0,
        settings: {
          allowChildrenToPost: true,
          allowChildrenToComment: true,
          requireApprovalForPosts: false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMembers = [
        {
          userId: 'user-123',
          displayName: 'お父さん',
          photoURL: null,
          relation: 'お父さん' as const,
          role: 'admin' as const,
          joinedAt: new Date(),
          invitedBy: null,
        },
      ];

      mockFamilyService.getFamily.mockResolvedValue(mockFamily);
      mockMemberService.getFamilyMembers.mockResolvedValue(mockMembers);

      const { result } = renderHook(() => useFamilyStore());

      await act(async () => {
        await result.current.selectFamily('family-1');
      });

      expect(result.current.currentFamily).toEqual(mockFamily);
      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createFamily', () => {
    it('should create a new family', async () => {
      const mockFamily = {
        id: 'family-new',
        name: '新しい家族',
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUserFamilies = [
        {
          familyId: 'family-new',
          familyName: '新しい家族',
          familyIconURL: null,
          role: 'admin' as const,
          relation: 'お父さん' as const,
          joinedAt: new Date(),
          lastViewedAt: new Date(),
          unreadPostCount: 0,
        },
      ];

      mockFamilyService.createFamily.mockResolvedValue(mockFamily);
      mockFamilyService.getUserFamilies.mockResolvedValue(mockUserFamilies);

      const { result } = renderHook(() => useFamilyStore());

      let createdFamily;
      await act(async () => {
        createdFamily = await result.current.createFamily({
          name: '新しい家族',
          ownerId: 'user-123',
          ownerName: 'テストユーザー',
          ownerRelation: 'お父さん',
        });
      });

      expect(createdFamily).toEqual(mockFamily);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('updateFamily', () => {
    it('should update family', async () => {
      mockFamilyService.updateFamily.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFamilyStore());

      // Set current family first
      act(() => {
        result.current.setCurrentFamily({
          id: 'family-1',
          name: '古い名前',
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
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await act(async () => {
        await result.current.updateFamily('family-1', {
          name: '新しい名前',
        });
      });

      expect(mockFamilyService.updateFamily).toHaveBeenCalledWith('family-1', {
        name: '新しい名前',
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useFamilyStore());

      act(() => {
        result.current.setError('Some error');
      });

      expect(result.current.error).toBe('Some error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
