import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PinnedPostSection } from '@components/board/PinnedPostSection';
import type { Post } from '@/src/types/post';

describe('PinnedPostSection', () => {
  const mockPinnedPost: Post = {
    id: 'post-1',
    familyId: 'family-1',
    boardId: 'board-1',
    content: 'ピン留め投稿です',
    imageUrls: [],
    authorId: 'user-1',
    authorName: 'テストユーザー',
    authorPhotoURL: null,
    isPinned: true,
    commentCount: 5,
    readBy: ['user-1'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPinnedPosts: Post[] = [
    mockPinnedPost,
    {
      ...mockPinnedPost,
      id: 'post-2',
      content: '2番目のピン留め投稿',
    },
  ];

  it('ピン留め投稿がない場合、何も表示しない', () => {
    const { queryByTestId } = render(
      <PinnedPostSection posts={[]} testID="pinned-section" />
    );

    expect(queryByTestId('pinned-section')).toBeNull();
  });

  it('ピン留め投稿を表示する', () => {
    const { getByText } = render(<PinnedPostSection posts={mockPinnedPosts} />);

    expect(getByText('ピン留め投稿です')).toBeTruthy();
    expect(getByText('2番目のピン留め投稿')).toBeTruthy();
  });

  it('セクションヘッダーを表示する', () => {
    const { getByText } = render(<PinnedPostSection posts={mockPinnedPosts} />);

    expect(getByText('ピン留め投稿')).toBeTruthy();
  });

  it('投稿がクリックされたときonPressPostを呼び出す', () => {
    const onPressPost = jest.fn();
    const { getByText } = render(
      <PinnedPostSection posts={mockPinnedPosts} onPressPost={onPressPost} />
    );

    fireEvent.press(getByText('ピン留め投稿です'));
    expect(onPressPost).toHaveBeenCalledWith(mockPinnedPost);
  });

  it('ピンアイコンを表示する', () => {
    const { getByTestId } = render(
      <PinnedPostSection posts={mockPinnedPosts} testID="pinned-section" />
    );

    expect(getByTestId('pinned-section')).toBeTruthy();
  });

  it('複数のピン留め投稿を正しい順序で表示する', () => {
    const { getAllByTestId } = render(
      <PinnedPostSection posts={mockPinnedPosts} />
    );

    const postItems = getAllByTestId(/pinned-post-item-/);
    expect(postItems).toHaveLength(2);
  });

  it('投稿の作成者名を表示する', () => {
    const { getByText } = render(<PinnedPostSection posts={[mockPinnedPost]} />);

    expect(getByText('テストユーザー')).toBeTruthy();
  });

  it('コメント数を表示する', () => {
    const { getByText } = render(<PinnedPostSection posts={[mockPinnedPost]} />);

    expect(getByText(/5/)).toBeTruthy();
  });

  it('カスタムスタイルを適用できる', () => {
    const { getByTestId } = render(
      <PinnedPostSection
        posts={mockPinnedPosts}
        testID="pinned-section"
        style={{ marginTop: 20 }}
      />
    );

    const section = getByTestId('pinned-section');
    expect(section.props.style).toContainEqual({ marginTop: 20 });
  });
});
