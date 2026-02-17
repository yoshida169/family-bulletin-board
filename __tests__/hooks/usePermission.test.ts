import { renderHook } from '@testing-library/react-native';
import { usePermission, useIsFamilyMember, useFamilyRole } from '@hooks/usePermission';
import { useAuthStore } from '@store/authStore';
import { useFamilyStore } from '@store/familyStore';
import type { Family } from '@/src/types/family';

// Mock stores
jest.mock('@store/authStore');
jest.mock('@store/familyStore');

const mockUseAuthStore = jest.mocked(useAuthStore);
const mockUseFamilyStore = jest.mocked(useFamilyStore);

describe('usePermission', () => {
  const mockUser = {
    uid: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockFamily: Family = {
    id: 'family123',
    name: 'Test Family',
    description: null,
    iconURL: null,
    ownerId: 'owner123',
    adminIds: ['owner123', 'admin456'],
    memberCount: 3,
    postCount: 0,
    settings: {
      allowChildrenToPost: true,
      allowChildrenToComment: true,
      requireApprovalForPosts: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseAuthStore.mockImplementation((selector: any) =>
        selector({ user: null })
      );
      mockUseFamilyStore.mockReturnValue({
        currentFamily: mockFamily,
        userFamilies: [],
      } as any);
    });

    it('should return all permissions as false', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isOwner).toBe(false);
      expect(result.current.canEditFamily).toBe(false);
      expect(result.current.canDeleteFamily).toBe(false);
      expect(result.current.canInviteMember).toBe(false);
      expect(result.current.canPinPost).toBe(false);
    });

    it('should return false for resource-level permissions', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.canEditPost('author123')).toBe(false);
      expect(result.current.canDeletePost('author123')).toBe(false);
      expect(result.current.canDeleteComment('author123')).toBe(false);
    });
  });

  describe('when user is a regular member (not admin)', () => {
    beforeEach(() => {
      mockUseAuthStore.mockImplementation((selector: any) =>
        selector({ user: mockUser })
      );
      mockUseFamilyStore.mockReturnValue({
        currentFamily: mockFamily,
        userFamilies: [],
      } as any);
    });

    it('should return false for admin-only permissions', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isOwner).toBe(false);
      expect(result.current.canEditFamily).toBe(false);
      expect(result.current.canInviteMember).toBe(false);
      expect(result.current.canPinPost).toBe(false);
    });

    it('should allow editing own posts', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.canEditPost(mockUser.uid)).toBe(true);
      expect(result.current.canEditPost('other-user')).toBe(false);
    });

    it('should allow deleting own posts and comments', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.canDeletePost(mockUser.uid)).toBe(true);
      expect(result.current.canDeletePost('other-user')).toBe(false);
      expect(result.current.canDeleteComment(mockUser.uid)).toBe(true);
      expect(result.current.canDeleteComment('other-user')).toBe(false);
    });
  });

  describe('when user is an admin (not owner)', () => {
    beforeEach(() => {
      const adminUser = { ...mockUser, uid: 'admin456' };
      mockUseAuthStore.mockImplementation((selector: any) =>
        selector({ user: adminUser })
      );
      mockUseFamilyStore.mockReturnValue({
        currentFamily: mockFamily,
        userFamilies: [],
      } as any);
    });

    it('should return true for admin permissions', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isOwner).toBe(false);
      expect(result.current.canEditFamily).toBe(true);
      expect(result.current.canInviteMember).toBe(true);
      expect(result.current.canRemoveMember).toBe(true);
      expect(result.current.canCreateBoard).toBe(true);
      expect(result.current.canPinPost).toBe(true);
    });

    it('should allow deleting any post or comment', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.canDeletePost('any-user')).toBe(true);
      expect(result.current.canDeleteComment('any-user')).toBe(true);
    });

    it('should not allow deleting family (owner only)', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.canDeleteFamily).toBe(false);
    });
  });

  describe('when user is the owner', () => {
    beforeEach(() => {
      const ownerUser = { ...mockUser, uid: 'owner123' };
      mockUseAuthStore.mockImplementation((selector: any) =>
        selector({ user: ownerUser })
      );
      mockUseFamilyStore.mockReturnValue({
        currentFamily: mockFamily,
        userFamilies: [],
      } as any);
    });

    it('should return true for all permissions', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isOwner).toBe(true);
      expect(result.current.canEditFamily).toBe(true);
      expect(result.current.canDeleteFamily).toBe(true);
      expect(result.current.canInviteMember).toBe(true);
      expect(result.current.canRemoveMember).toBe(true);
      expect(result.current.canPinPost).toBe(true);
    });
  });

  describe('when no family is selected', () => {
    beforeEach(() => {
      mockUseAuthStore.mockImplementation((selector: any) =>
        selector({ user: mockUser })
      );
      mockUseFamilyStore.mockReturnValue({
        currentFamily: null,
        userFamilies: [],
      } as any);
    });

    it('should return all permissions as false', () => {
      const { result } = renderHook(() => usePermission());

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isOwner).toBe(false);
      expect(result.current.canEditFamily).toBe(false);
    });
  });
});

describe('useIsFamilyMember', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true if user is a member', () => {
    mockUseFamilyStore.mockReturnValue({
      userFamilies: [
        { familyId: 'family123', familyName: 'Test', role: 'admin' },
        { familyId: 'family456', familyName: 'Test2', role: 'member' },
      ],
    } as any);

    const { result } = renderHook(() => useIsFamilyMember('family123'));
    expect(result.current).toBe(true);
  });

  it('should return false if user is not a member', () => {
    mockUseFamilyStore.mockReturnValue({
      userFamilies: [
        { familyId: 'family123', familyName: 'Test', role: 'admin' },
      ],
    } as any);

    const { result } = renderHook(() => useIsFamilyMember('family999'));
    expect(result.current).toBe(false);
  });

  it('should return false if familyId is null', () => {
    mockUseFamilyStore.mockReturnValue({
      userFamilies: [],
    } as any);

    const { result } = renderHook(() => useIsFamilyMember(null));
    expect(result.current).toBe(false);
  });
});

describe('useFamilyRole', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user role in family', () => {
    mockUseFamilyStore.mockReturnValue({
      userFamilies: [
        { familyId: 'family123', familyName: 'Test', role: 'admin' },
        { familyId: 'family456', familyName: 'Test2', role: 'child' },
      ],
    } as any);

    const { result: result1 } = renderHook(() => useFamilyRole('family123'));
    expect(result1.current).toBe('admin');

    const { result: result2 } = renderHook(() => useFamilyRole('family456'));
    expect(result2.current).toBe('child');
  });

  it('should return null if user is not a member', () => {
    mockUseFamilyStore.mockReturnValue({
      userFamilies: [
        { familyId: 'family123', familyName: 'Test', role: 'admin' },
      ],
    } as any);

    const { result } = renderHook(() => useFamilyRole('family999'));
    expect(result.current).toBeNull();
  });

  it('should return null if familyId is null', () => {
    mockUseFamilyStore.mockReturnValue({
      userFamilies: [],
    } as any);

    const { result } = renderHook(() => useFamilyRole(null));
    expect(result.current).toBeNull();
  });
});
