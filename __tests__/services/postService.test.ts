import { postService } from '@services/firebase/post';
import firestore from '@react-native-firebase/firestore';
import type { CreatePostInput, UpdatePostInput } from '@/src/types/post';

// Mock setup
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockBatch = {
  set: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn(),
};
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockStartAfter = jest.fn();
const mockWhere = jest.fn();
const mockOnSnapshot = jest.fn();

const mockDocRef = (id: string = 'mock-post-id') => ({
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
    limit: mockLimit,
    startAfter: mockStartAfter,
    where: mockWhere,
    onSnapshot: mockOnSnapshot,
  };
  mockOrderBy.mockReturnValue(ref);
  mockLimit.mockReturnValue(ref);
  mockStartAfter.mockReturnValue(ref);
  mockWhere.mockReturnValue(ref);
  return ref;
};

const mockFirestoreInstance = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          collection: mockCollectionRef,
          update: mockUpdate,
        })),
      })),
    })),
  })),
  batch: jest.fn(() => mockBatch),
};

jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = jest.fn(() => mockFirestoreInstance);
  mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((n) => n),
    arrayUnion: jest.fn((item) => [item]),
  };
  return {
    __esModule: true,
    default: mockFirestore,
  };
});

describe('postService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('新しい投稿を正しいデータで作成できる', async () => {
      mockBatch.commit.mockResolvedValueOnce(undefined);

      const input: CreatePostInput = {
        familyId: 'family-123',
        boardId: 'board-123',
        content: 'テスト投稿です',
        imageUrls: ['https://example.com/image.jpg'],
        authorId: 'user-123',
        authorName: 'テストユーザー',
        authorPhotoURL: 'https://example.com/photo.jpg',
      };

      const result = await postService.createPost(input);

      expect(mockBatch.set).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
      expect(result.content).toBe(input.content);
      expect(result.authorId).toBe(input.authorId);
      expect(result.isPinned).toBe(false);
      expect(result.commentCount).toBe(0);
      expect(result.readBy).toEqual([input.authorId]);
    });

    it('画像なしで投稿を作成できる', async () => {
      mockBatch.commit.mockResolvedValueOnce(undefined);

      const input: CreatePostInput = {
        familyId: 'family-123',
        boardId: 'board-123',
        content: 'シンプル投稿',
        authorId: 'user-123',
        authorName: 'テストユーザー',
      };

      const result = await postService.createPost(input);

      expect(result.imageUrls).toEqual([]);
    });
  });

  describe('getPost', () => {
    it('投稿が存在する場合、投稿データを返す', async () => {
      const mockPostData = {
        id: 'post-123',
        familyId: 'family-123',
        boardId: 'board-123',
        content: 'テスト投稿',
        imageUrls: [],
        authorId: 'user-123',
        authorName: 'テストユーザー',
        authorPhotoURL: null,
        isPinned: false,
        commentCount: 3,
        readBy: ['user-123'],
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
      };

      mockGet.mockResolvedValueOnce({
        exists: true,
        id: 'post-123',
        data: () => mockPostData,
      });

      const result = await postService.getPost('family-123', 'board-123', 'post-123');

      expect(result).toBeTruthy();
      expect(result?.content).toBe('テスト投稿');
      expect(result?.commentCount).toBe(3);
    });

    it('投稿が存在しない場合、nullを返す', async () => {
      mockGet.mockResolvedValueOnce({
        exists: false,
      });

      const result = await postService.getPost('family-123', 'board-123', 'post-123');

      expect(result).toBeNull();
    });
  });

  describe('getBoardPosts', () => {
    it('掲示板の投稿一覧を取得できる', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          familyId: 'family-123',
          boardId: 'board-123',
          content: '投稿1',
          imageUrls: [],
          authorId: 'user-123',
          authorName: 'ユーザー1',
          authorPhotoURL: null,
          isPinned: true,
          commentCount: 0,
          readBy: [],
          createdAt: { toDate: () => new Date('2024-01-02') },
          updatedAt: { toDate: () => new Date('2024-01-02') },
        },
        {
          id: 'post-2',
          familyId: 'family-123',
          boardId: 'board-123',
          content: '投稿2',
          imageUrls: [],
          authorId: 'user-456',
          authorName: 'ユーザー2',
          authorPhotoURL: null,
          isPinned: false,
          commentCount: 5,
          readBy: ['user-123'],
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        },
      ];

      mockGet.mockResolvedValueOnce({
        docs: mockPosts.map((post) => ({
          id: post.id,
          data: () => post,
        })),
      });

      const result = await postService.getBoardPosts('family-123', 'board-123');

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('投稿1');
      expect(result[1].content).toBe('投稿2');
    });

    it('投稿がない場合、空配列を返す', async () => {
      mockGet.mockResolvedValueOnce({
        docs: [],
      });

      const result = await postService.getBoardPosts('family-123', 'board-123');

      expect(result).toEqual([]);
    });
  });

  describe('updatePost', () => {
    it('投稿を更新できる', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      const updates: UpdatePostInput = {
        content: '更新された投稿',
        imageUrls: ['https://example.com/new-image.jpg'],
      };

      await postService.updatePost('family-123', 'board-123', 'post-123', updates);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '更新された投稿',
          imageUrls: ['https://example.com/new-image.jpg'],
        })
      );
    });
  });

  describe('deletePost', () => {
    it('投稿を削除し、掲示板の投稿数を減らす', async () => {
      mockBatch.commit.mockResolvedValueOnce(undefined);

      await postService.deletePost('family-123', 'board-123', 'post-123');

      expect(mockBatch.delete).toHaveBeenCalled();
      expect(mockBatch.update).toHaveBeenCalled();
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe('markAsRead', () => {
    it('投稿を既読としてマークできる', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await postService.markAsRead('family-123', 'board-123', 'post-123', 'user-456');

      expect(mockUpdate).toHaveBeenCalledWith({
        readBy: ['user-456'],
      });
    });

    it('同じユーザーが複数回既読マークしても重複しない', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await postService.markAsRead('family-123', 'board-123', 'post-123', 'user-123');

      // arrayUnionは重複を防ぐ
      expect(mockUpdate).toHaveBeenCalledWith({
        readBy: ['user-123'],
      });
    });
  });

  describe('togglePin', () => {
    it('投稿をピン留めできる', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await postService.togglePin('family-123', 'board-123', 'post-123', true);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isPinned: true,
        })
      );
    });

    it('投稿のピン留めを解除できる', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await postService.togglePin('family-123', 'board-123', 'post-123', false);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isPinned: false,
        })
      );
    });

    it('updatedAtフィールドが更新される', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await postService.togglePin('family-123', 'board-123', 'post-123', true);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('ユーザーの未読投稿数を取得できる', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          readBy: ['user-123'],
          data: () => ({ readBy: ['user-123'] }),
        },
        {
          id: 'post-2',
          readBy: [],
          data: () => ({ readBy: [] }),
        },
        {
          id: 'post-3',
          readBy: ['user-123'],
          data: () => ({ readBy: ['user-123'] }),
        },
      ];

      mockGet.mockResolvedValueOnce({
        docs: mockPosts,
      });

      const result = await postService.getUnreadCount('family-123', 'board-123', 'user-456');

      // user-456が既読していない投稿は3件全て
      expect(result).toBe(3);
    });

    it('すべて既読の場合、0を返す', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          readBy: ['user-123'],
          data: () => ({ readBy: ['user-123'] }),
        },
      ];

      mockGet.mockResolvedValueOnce({
        docs: mockPosts,
      });

      const result = await postService.getUnreadCount('family-123', 'board-123', 'user-123');

      expect(result).toBe(0);
    });

    it('投稿がない場合、0を返す', async () => {
      mockGet.mockResolvedValueOnce({
        docs: [],
      });

      const result = await postService.getUnreadCount('family-123', 'board-123', 'user-123');

      expect(result).toBe(0);
    });
  });

  describe('subscribeToBoardPosts', () => {
    it('リアルタイム更新をサブスクライブできる', () => {
      const mockCallback = jest.fn();
      const unsubscribe = jest.fn();

      mockOnSnapshot.mockReturnValueOnce(unsubscribe);

      const result = postService.subscribeToBoardPosts('family-123', 'board-123', mockCallback);

      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(result).toBe(unsubscribe);
    });
  });
});
