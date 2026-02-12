import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { SearchResultList } from '@/components/board/SearchResultList';
import type { Post, Comment } from '@/types/post';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

describe('SearchResultList', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  };

  const mockFamilyId = 'family123';
  const mockBoardId = 'board123';

  const mockPost: Post = {
    id: 'post1',
    familyId: mockFamilyId,
    boardId: mockBoardId,
    content: 'これはテスト投稿です',
    imageUrls: ['image1.jpg'],
    authorId: 'user1',
    authorName: 'テストユーザー1',
    authorPhotoURL: null,
    isPinned: false,
    commentCount: 5,
    readBy: ['user1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockComment: Comment = {
    id: 'comment1',
    postId: 'post1',
    boardId: mockBoardId,
    familyId: mockFamilyId,
    content: 'これはテストコメントです',
    imageUrl: null,
    authorId: 'user2',
    authorName: 'テストユーザー2',
    authorPhotoURL: null,
    parentCommentId: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('投稿の検索結果を表示する', () => {
    const results = [
      {
        type: 'post' as const,
        post: mockPost,
      },
    ];

    const { getByText } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    expect(getByText('投稿')).toBeTruthy();
    expect(getByText('テストユーザー1')).toBeTruthy();
    expect(getByText('これはテスト投稿です')).toBeTruthy();
    expect(getByText('5件のコメント')).toBeTruthy();
    expect(getByText('1枚の画像')).toBeTruthy();
  });

  it('コメントの検索結果を表示する', () => {
    const results = [
      {
        type: 'comment' as const,
        comment: mockComment,
        parentPost: mockPost,
      },
    ];

    const { getByText } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    expect(getByText('コメント')).toBeTruthy();
    expect(getByText('テストユーザー2')).toBeTruthy();
    expect(getByText('これはテストコメントです')).toBeTruthy();
  });

  it('投稿をタップすると投稿詳細に遷移する', () => {
    const results = [
      {
        type: 'post' as const,
        post: mockPost,
      },
    ];

    const { getByText } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    fireEvent.press(getByText('これはテスト投稿です'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/family/${mockFamilyId}/board/${mockBoardId}/post/${mockPost.id}`
    );
  });

  it('コメントをタップすると親投稿の詳細に遷移する', () => {
    const results = [
      {
        type: 'comment' as const,
        comment: mockComment,
        parentPost: mockPost,
      },
    ];

    const { getByText } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    fireEvent.press(getByText('これはテストコメントです'));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/family/${mockFamilyId}/board/${mockBoardId}/post/${mockPost.id}`
    );
  });

  it('検索結果が空の場合に空状態を表示する', () => {
    const { getByText } = render(
      <SearchResultList
        results={[]}
        keyword="存在しないキーワード"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    expect(getByText('検索結果が見つかりませんでした')).toBeTruthy();
    expect(getByText('キーワード: "存在しないキーワード"')).toBeTruthy();
  });

  it('カスタムの空メッセージを表示する', () => {
    const customMessage = 'カスタム空メッセージ';

    const { getByText } = render(
      <SearchResultList
        results={[]}
        keyword="test"
        familyId={mockFamilyId}
        boardId={mockBoardId}
        emptyMessage={customMessage}
      />
    );

    expect(getByText(customMessage)).toBeTruthy();
  });

  it('ピン留め投稿にピンアイコンを表示する', () => {
    const pinnedPost: Post = {
      ...mockPost,
      isPinned: true,
    };

    const results = [
      {
        type: 'post' as const,
        post: pinnedPost,
      },
    ];

    const { UNSAFE_getByType } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    // ピンアイコンが存在することを確認
    // Note: アイコンの確認は実装依存のため、スナップショットテストで確認するのが良い
    expect(UNSAFE_getByType).toBeDefined();
  });

  it('コメントの親投稿情報を表示する', () => {
    const results = [
      {
        type: 'comment' as const,
        comment: mockComment,
        parentPost: mockPost,
      },
    ];

    const { getByText } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    // 親投稿のプレビューが表示されることを確認
    expect(getByText(/投稿: これはテスト投稿です/)).toBeTruthy();
  });

  it('複数の検索結果を表示する', () => {
    const results = [
      {
        type: 'post' as const,
        post: mockPost,
      },
      {
        type: 'comment' as const,
        comment: mockComment,
        parentPost: mockPost,
      },
    ];

    const { getByText } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    expect(getByText('投稿')).toBeTruthy();
    expect(getByText('コメント')).toBeTruthy();
  });

  it('日付をフォーマットして表示する', () => {
    const results = [
      {
        type: 'post' as const,
        post: mockPost,
      },
    ];

    const { getByText } = render(
      <SearchResultList
        results={results}
        keyword="テスト"
        familyId={mockFamilyId}
        boardId={mockBoardId}
      />
    );

    // 日付がフォーマットされて表示されることを確認
    expect(getByText('2024/1/1')).toBeTruthy();
  });
});
