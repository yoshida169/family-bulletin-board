import { commentService } from '@/services/firebase/comment';
import firestore from '@react-native-firebase/firestore';

// Mock Firebase
jest.mock('@react-native-firebase/firestore');

describe('commentService.searchComments', () => {
  const mockFamilyId = 'family123';
  const mockBoardId = 'board123';

  const mockPosts = [
    { id: 'post1' },
    { id: 'post2' },
  ];

  const mockComments = {
    post1: [
      {
        id: 'comment1',
        postId: 'post1',
        boardId: mockBoardId,
        familyId: mockFamilyId,
        content: 'これはテストコメントです',
        imageUrl: null,
        authorId: 'user1',
        authorName: 'テストユーザー1',
        authorPhotoURL: null,
        parentCommentId: null,
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') },
      },
      {
        id: 'comment2',
        postId: 'post1',
        boardId: mockBoardId,
        familyId: mockFamilyId,
        content: '同意します',
        imageUrl: null,
        authorId: 'user2',
        authorName: 'テストユーザー2',
        authorPhotoURL: null,
        parentCommentId: null,
        createdAt: { toDate: () => new Date('2024-01-02') },
        updatedAt: { toDate: () => new Date('2024-01-02') },
      },
    ],
    post2: [
      {
        id: 'comment3',
        postId: 'post2',
        boardId: mockBoardId,
        familyId: mockFamilyId,
        content: 'テスト結果を確認しました',
        imageUrl: null,
        authorId: 'user1',
        authorName: 'テストユーザー1',
        authorPhotoURL: null,
        parentCommentId: null,
        createdAt: { toDate: () => new Date('2024-01-03') },
        updatedAt: { toDate: () => new Date('2024-01-03') },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Firestore query chain for posts
    const mockPostsGet = jest.fn().mockResolvedValue({
      docs: mockPosts.map((post) => ({
        id: post.id,
        data: () => post,
      })),
    });

    // Mock Firestore query chain for comments
    const createMockCommentsGet = (postId: string) => {
      return jest.fn().mockResolvedValue({
        docs: (mockComments[postId as keyof typeof mockComments] || []).map(
          (comment) => ({
            id: comment.id,
            data: () => comment,
          })
        ),
      });
    };

    const mockCommentsCollection = (postId: string) => ({
      get: createMockCommentsGet(postId),
    });

    const mockPostDoc = (postId: string) => ({
      collection: jest.fn().mockReturnValue(mockCommentsCollection(postId)),
    });

    const mockPostsCollection = {
      get: mockPostsGet,
      doc: jest.fn().mockImplementation((postId) => mockPostDoc(postId)),
    };

    const mockBoardDoc = {
      collection: jest.fn().mockReturnValue(mockPostsCollection),
    };

    const mockBoardsCollection = {
      doc: jest.fn().mockReturnValue(mockBoardDoc),
    };

    const mockFamilyDoc = {
      collection: jest.fn().mockReturnValue(mockBoardsCollection),
    };

    (firestore as jest.Mock).mockReturnValue({
      collection: jest.fn().mockReturnValue({
        doc: jest.fn().mockReturnValue(mockFamilyDoc),
      }),
    });
  });

  it('キーワードに一致するコメントを返す', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.content.includes('テスト'))).toBe(true);
  });

  it('大文字小文字を区別せずに検索する', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      'てすと'
    );

    expect(results).toHaveLength(2);
  });

  it('前後の空白を無視する', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      '  テスト  '
    );

    expect(results).toHaveLength(2);
  });

  it('空のキーワードで空配列を返す', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      ''
    );

    expect(results).toHaveLength(0);
  });

  it('空白のみのキーワードで空配列を返す', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      '   '
    );

    expect(results).toHaveLength(0);
  });

  it('一致しないキーワードで空配列を返す', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      '存在しないキーワード'
    );

    expect(results).toHaveLength(0);
  });

  it('部分一致で検索する', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      '同意'
    );

    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('同意');
  });

  it('返されたコメントのcreatedAtがDateオブジェクトである', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    expect(results[0].createdAt).toBeInstanceOf(Date);
    expect(results[0].updatedAt).toBeInstanceOf(Date);
  });

  it('返されたコメントにpostIdが含まれる', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    expect(results.every((r) => r.postId)).toBe(true);
    expect(['post1', 'post2']).toContain(results[0].postId);
  });

  it('複数の投稿からコメントを検索する', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    const postIds = results.map((r) => r.postId);
    const uniquePostIds = [...new Set(postIds)];
    expect(uniquePostIds.length).toBeGreaterThan(1);
  });

  it('特定の投稿のみにコメントがある場合も正しく検索する', async () => {
    const results = await commentService.searchComments(
      mockFamilyId,
      mockBoardId,
      '同意'
    );

    expect(results).toHaveLength(1);
    expect(results[0].postId).toBe('post1');
  });
});
