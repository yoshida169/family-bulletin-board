import { boardService } from '@services/firebase/board';
import firestore from '@react-native-firebase/firestore';
import type { CreateBoardInput, UpdateBoardInput } from '@/src/types/post';

// Mock setup
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockOrderBy = jest.fn();
const mockOnSnapshot = jest.fn();

const mockDocRef = (id: string = 'mock-board-id') => ({
  id,
  get: mockGet,
  set: mockSet,
  update: mockUpdate,
  delete: mockDelete,
});

const mockCollectionRef = () => {
  const ref = {
    doc: jest.fn((id?: string) => mockDocRef(id)),
    get: mockGet,
    orderBy: mockOrderBy,
    onSnapshot: mockOnSnapshot,
  };
  mockOrderBy.mockReturnValue(ref);
  return ref;
};

const mockFirestoreInstance = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      collection: mockCollectionRef,
    })),
  })),
};

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = jest.fn(() => mockFirestoreInstance);
  mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((n) => n),
  };
  return {
    __esModule: true,
    default: mockFirestore,
  };
});

describe('boardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBoard', () => {
    it('新しい掲示板を正しいデータで作成できる', async () => {
      const mockBoardId = 'board-123';
      mockSet.mockResolvedValueOnce(undefined);

      const input: CreateBoardInput = {
        name: 'テスト掲示板',
        description: 'テスト用の掲示板です',
        familyId: 'family-123',
        createdBy: 'user-123',
      };

      const result = await boardService.createBoard(input);

      expect(mockSet).toHaveBeenCalled();
      expect(result.name).toBe(input.name);
      expect(result.description).toBe(input.description);
      expect(result.familyId).toBe(input.familyId);
      expect(result.createdBy).toBe(input.createdBy);
      expect(result.postCount).toBe(0);
    });

    it('説明なしで掲示板を作成できる', async () => {
      mockSet.mockResolvedValueOnce(undefined);

      const input: CreateBoardInput = {
        name: 'シンプル掲示板',
        familyId: 'family-123',
        createdBy: 'user-123',
      };

      const result = await boardService.createBoard(input);

      expect(result.description).toBeUndefined();
    });
  });

  describe('getBoard', () => {
    it('掲示板が存在する場合、掲示板データを返す', async () => {
      const mockBoardData = {
        id: 'board-123',
        name: 'テスト掲示板',
        description: 'テスト用',
        familyId: 'family-123',
        createdBy: 'user-123',
        postCount: 5,
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
      };

      mockGet.mockResolvedValueOnce({
        exists: true,
        id: 'board-123',
        data: () => mockBoardData,
      });

      const result = await boardService.getBoard('family-123', 'board-123');

      expect(result).toBeTruthy();
      expect(result?.name).toBe('テスト掲示板');
    });

    it('掲示板が存在しない場合、nullを返す', async () => {
      mockGet.mockResolvedValueOnce({
        exists: false,
      });

      const result = await boardService.getBoard('family-123', 'board-123');

      expect(result).toBeNull();
    });
  });

  describe('getFamilyBoards', () => {
    it('ファミリーの掲示板一覧を取得できる', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          name: '掲示板1',
          familyId: 'family-123',
          createdBy: 'user-123',
          postCount: 10,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        },
        {
          id: 'board-2',
          name: '掲示板2',
          familyId: 'family-123',
          createdBy: 'user-123',
          postCount: 5,
          createdAt: { toDate: () => new Date('2024-01-02') },
          updatedAt: { toDate: () => new Date('2024-01-02') },
        },
      ];

      mockGet.mockResolvedValueOnce({
        docs: mockBoards.map((board) => ({
          id: board.id,
          data: () => board,
        })),
      });

      const result = await boardService.getFamilyBoards('family-123');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('掲示板1');
      expect(result[1].name).toBe('掲示板2');
    });

    it('掲示板がない場合、空配列を返す', async () => {
      mockGet.mockResolvedValueOnce({
        docs: [],
      });

      const result = await boardService.getFamilyBoards('family-123');

      expect(result).toEqual([]);
    });
  });

  describe('updateBoard', () => {
    it('掲示板を更新できる', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      const updates: UpdateBoardInput = {
        name: '更新された掲示板',
        description: '新しい説明',
      };

      await boardService.updateBoard('family-123', 'board-123', updates);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '更新された掲示板',
          description: '新しい説明',
        })
      );
    });
  });

  describe('deleteBoard', () => {
    it('掲示板を削除できる', async () => {
      mockDelete.mockResolvedValueOnce(undefined);

      await boardService.deleteBoard('family-123', 'board-123');

      expect(mockDelete).toHaveBeenCalled();
    });
  });
});
