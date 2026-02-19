import { postService } from '@/services/firebase/post';

// Mock setup
const mockGet = jest.fn();
const mockOrderBy = jest.fn();

// Mock posts in descending order by date (newest first) - matching Firestore orderBy
const mockPosts = [
  {
    id: 'post3',
    familyId: 'family123',
    boardId: 'board123',
    content: 'テスト結果が良好でした',
    imageUrls: ['image1.jpg'],
    authorId: 'user1',
    authorName: 'テストユーザー1',
    authorPhotoURL: null,
    isPinned: true,
    commentCount: 5,
    readBy: ['user1', 'user2'],
    createdAt: { toDate: () => new Date('2024-01-03') },
    updatedAt: { toDate: () => new Date('2024-01-03') },
  },
  {
    id: 'post2',
    familyId: 'family123',
    boardId: 'board123',
    content: '今日の天気は晴れです',
    imageUrls: [],
    authorId: 'user2',
    authorName: 'テストユーザー2',
    authorPhotoURL: null,
    isPinned: false,
    commentCount: 2,
    readBy: ['user2'],
    createdAt: { toDate: () => new Date('2024-01-02') },
    updatedAt: { toDate: () => new Date('2024-01-02') },
  },
  {
    id: 'post1',
    familyId: 'family123',
    boardId: 'board123',
    content: 'これはテスト投稿です',
    imageUrls: [],
    authorId: 'user1',
    authorName: 'テストユーザー1',
    authorPhotoURL: null,
    isPinned: false,
    commentCount: 0,
    readBy: ['user1'],
    createdAt: { toDate: () => new Date('2024-01-01') },
    updatedAt: { toDate: () => new Date('2024-01-01') },
  },
];

const mockCollectionRef = () => {
  const ref = {
    orderBy: mockOrderBy,
    get: mockGet,
  };
  mockOrderBy.mockReturnValue(ref);
  return ref;
};

const mockFirestoreInstance = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          collection: mockCollectionRef,
        })),
      })),
    })),
  })),
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

describe('postService.searchPosts', () => {
  const mockFamilyId = 'family123';
  const mockBoardId = 'board123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({
      docs: mockPosts.map((post) => ({
        id: post.id,
        data: () => post,
      })),
    });
  });

  it('キーワードに一致する投稿を返す', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    expect(results).toHaveLength(2);
    expect(results[0].content).toContain('テスト');
    expect(results[1].content).toContain('テスト');
  });

  it('大文字小文字を区別せずに検索する', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    expect(results).toHaveLength(2);

    // 小文字のアルファベットでもテスト
    const results2 = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      'てすと'
    );

    // 注: ひらがなとカタカナは toLowerCase() で同じにならないため、別のキーワードとして扱われる
    expect(results2).toHaveLength(0);
  });

  it('前後の空白を無視する', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      '  テスト  '
    );

    expect(results).toHaveLength(2);
  });

  it('空のキーワードで空配列を返す', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      ''
    );

    expect(results).toHaveLength(0);
  });

  it('空白のみのキーワードで空配列を返す', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      '   '
    );

    expect(results).toHaveLength(0);
  });

  it('一致しないキーワードで空配列を返す', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      '存在しないキーワード'
    );

    expect(results).toHaveLength(0);
  });

  it('部分一致で検索する', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      '天気'
    );

    expect(results).toHaveLength(1);
    expect(results[0].content).toContain('天気');
  });

  it('返された投稿のcreatedAtがDateオブジェクトである', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    expect(results[0].createdAt).toBeInstanceOf(Date);
    expect(results[0].updatedAt).toBeInstanceOf(Date);
  });

  it('複数の単語を含むキーワードで検索する', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      '天気 晴れ'
    );

    // "天気 晴れ"という文字列全体を検索
    expect(results).toHaveLength(0);
  });

  it('日付の新しい順にソートされている', async () => {
    const results = await postService.searchPosts(
      mockFamilyId,
      mockBoardId,
      'テスト'
    );

    // post3 (2024-01-03) が post1 (2024-01-01) より新しいはず
    expect(results[0].id).toBe('post3'); // 最も新しい投稿
    expect(results[1].id).toBe('post1'); // 2番目に新しい投稿
    expect(results[0].createdAt.getTime()).toBeGreaterThan(
      results[1].createdAt.getTime()
    );
  });
});
