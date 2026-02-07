import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FamilyCard } from '@components/family/FamilyCard';
import type { UserFamilyRelation } from '@/src/types/family';

describe('FamilyCard', () => {
  const mockFamily: UserFamilyRelation = {
    familyId: 'family-1',
    familyName: 'テスト家族',
    familyIconURL: null,
    role: 'admin',
    relation: 'お父さん',
    joinedAt: new Date(),
    lastViewedAt: new Date(),
    unreadPostCount: 5,
  };

  it('should render family information', () => {
    const { getByText } = render(<FamilyCard family={mockFamily} />);

    expect(getByText('テスト家族')).toBeTruthy();
    expect(getByText('お父さん • 管理者')).toBeTruthy();
  });

  it('should show unread badge when there are unread posts', () => {
    const { getByText } = render(<FamilyCard family={mockFamily} />);

    expect(getByText('5')).toBeTruthy();
  });

  it('should not show unread badge when showUnreadBadge is false', () => {
    const { queryByText } = render(
      <FamilyCard family={mockFamily} showUnreadBadge={false} />
    );

    expect(queryByText('5')).toBeNull();
  });

  it('should show "99+" for unread count over 99', () => {
    const familyWithManyUnread = { ...mockFamily, unreadPostCount: 150 };
    const { getByText } = render(<FamilyCard family={familyWithManyUnread} />);

    expect(getByText('99+')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FamilyCard family={mockFamily} onPress={onPress} testID="family-card" />
    );

    fireEvent.press(getByTestId('family-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should show "メンバー" for child role', () => {
    const childFamily = { ...mockFamily, role: 'child' as const };
    const { getByText } = render(<FamilyCard family={childFamily} />);

    expect(getByText('お父さん • メンバー')).toBeTruthy();
  });
});
