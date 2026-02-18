import { commentService } from '@services/firebase/comment';
import firestore from '@react-native-firebase/firestore';
import type { CreateCommentInput } from '@/src/types/post';

// Mock setup
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
const mockOrderBy = jest.fn();
const mockOnSnapshot = jest.fn();

const mockDocRef = (id: string = 'mock-comment-id') => ({
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
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              collection: mockCollectionRef,
              update: mockUpdate,
            })),
          })),
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
  };
  return {
    __esModule: true,
    default: mockFirestore,
  };
});

describe('commentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createComment', () => {
    it('新しいコメントを正しいデータで作成できる', async () => {
      const input: CreateCommentInput = {
        postId: 'post-123',
        boardId: 'board-123',
        familyId: 'family-123',
        content: 'テストコメント',
        authorId: 'user-123',
        authorName: 'テストユーザー',
        authorPhotoURL: 'https://example.com/photo.jpg',
      };

      const result = await commentService.createComment(input);

      expect(mockBatchSet).toHaveBeenCalled();
      expect(mockBatchUpdate).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(result.content).toBe(input.content);
      expect(result.authorId).toBe(input.authorId);
      expect(result.parentCommentId).toBeNull();
    });

    it('返信コメント（parentCommentId付き）を作成できる', async () => {
      const input: CreateCommentInput = {
        postId: 'post-123',
        boardId: 'board-123',
        familyId: 'family-123',
        content: '返信コメント',
        authorId: 'user-456',
        authorName: 'ユーザー2',
        parentCommentId: 'comment-parent',
      };

      const result = await commentService.createComment(input);

      expect(result.parentCommentId).toBe('comment-parent');
    });
  });

  describe('getComment', () => {
    it('コメントが存在する場合、コメントデータを返す', async () => {
      const mockCommentData = {
        id: 'comment-123',
        postId: 'post-123',
        boardId: 'board-123',
        familyId: 'family-123',
        content: 'テストコメント',
        imageUrl: null,
        authorId: 'user-123',
        authorName: 'テストユーザー',
        authorPhotoURL: null,
        parentCommentId: null,
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      };

      mockGet.mockResolvedValueOnce({
        exists: true,
        id: 'comment-123',
        data: () => mockCommentData,
      });

      const result = await commentService.getComment(
        'family-123',
        'board-123',
        'post-123',
        'comment-123'
      );

      expect(result).toBeTruthy();
      expect(result?.content).toBe('テストコメント');
    });

    it('コメントが存在しない場合、nullを返す', async () => {
      mockGet.mockResolvedValueOnce({
        exists: false,
      });

      const result = await commentService.getComment(
        'family-123',
        'board-123',
        'post-123',
        'comment-123'
      );

      expect(result).toBeNull();
    });
  });

  describe('getPostComments', () => {
    it('投稿のコメント一覧を取得できる', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          postId: 'post-123',
          boardId: 'board-123',
          familyId: 'family-123',
          content: 'コメント1',
          imageUrl: null,
          authorId: 'user-123',
          authorName: 'ユーザー1',
          authorPhotoURL: null,
          parentCommentId: null,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        },
        {
          id: 'comment-2',
          postId: 'post-123',
          boardId: 'board-123',
          familyId: 'family-123',
          content: 'コメント2',
          imageUrl: null,
          authorId: 'user-456',
          authorName: 'ユーザー2',
          authorPhotoURL: null,
          parentCommentId: null,
          createdAt: { toDate: () => new Date('2024-01-02') },
          updatedAt: { toDate: () => new Date('2024-01-02') },
        },
      ];

      mockGet.mockResolvedValueOnce({
        docs: mockComments.map((comment) => ({
          id: comment.id,
          data: () => comment,
        })),
      });

      const result = await commentService.getPostComments(
        'family-123',
        'board-123',
        'post-123'
      );

      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('コメント1');
      expect(result[1].content).toBe('コメント2');
    });

    it('コメントがない場合、空配列を返す', async () => {
      mockGet.mockResolvedValueOnce({
        docs: [],
      });

      const result = await commentService.getPostComments(
        'family-123',
        'board-123',
        'post-123'
      );

      expect(result).toEqual([]);
    });
  });

  describe('updateComment', () => {
    it('コメントを更新できる', async () => {
      mockUpdate.mockResolvedValueOnce(undefined);

      await commentService.updateComment(
        'family-123',
        'board-123',
        'post-123',
        'comment-123',
        { content: '更新されたコメント' }
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          content: '更新されたコメント',
        })
      );
    });
  });

  describe('deleteComment', () => {
    it('コメントを削除できる（投稿のコメント数をデクリメント）', async () => {
      await commentService.deleteComment(
        'family-123',
        'board-123',
        'post-123',
        'comment-123'
      );

      expect(mockBatchDelete).toHaveBeenCalled();
      expect(mockBatchUpdate).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();
    });
  });
});
