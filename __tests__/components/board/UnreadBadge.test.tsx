import React from 'react';
import { render } from '@testing-library/react-native';
import { UnreadBadge } from '@components/board/UnreadBadge';

describe('UnreadBadge', () => {
  it('未読数を表示する', () => {
    const { getByText } = render(<UnreadBadge count={5} />);

    expect(getByText('5')).toBeTruthy();
  });

  it('未読数が0の場合、何も表示しない', () => {
    const { queryByTestId } = render(<UnreadBadge count={0} testID="unread-badge" />);

    expect(queryByTestId('unread-badge')).toBeNull();
  });

  it('未読数が99を超える場合、"99+"と表示する', () => {
    const { getByText } = render(<UnreadBadge count={150} />);

    expect(getByText('99+')).toBeTruthy();
  });

  it('未読数が99の場合、"99"と表示する', () => {
    const { getByText } = render(<UnreadBadge count={99} />);

    expect(getByText('99')).toBeTruthy();
  });

  it('未読数が1の場合、正しく表示する', () => {
    const { getByText } = render(<UnreadBadge count={1} />);

    expect(getByText('1')).toBeTruthy();
  });

  it('カスタムスタイルを適用できる', () => {
    const { getByTestId } = render(
      <UnreadBadge
        count={5}
        testID="unread-badge"
        style={{ marginLeft: 10 }}
      />
    );

    const badge = getByTestId('unread-badge');
    expect(badge.props.style).toContainEqual({ marginLeft: 10 });
  });

  it('小さいサイズで表示できる', () => {
    const { getByText } = render(<UnreadBadge count={5} size="small" />);

    expect(getByText('5')).toBeTruthy();
  });

  it('大きいサイズで表示できる', () => {
    const { getByText } = render(<UnreadBadge count={5} size="large" />);

    expect(getByText('5')).toBeTruthy();
  });
});
