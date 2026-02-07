import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FamilyList } from '@components/family/FamilyList';
import type { UserFamilyRelation } from '@/src/types/family';

describe('FamilyList', () => {
  const mockFamilies: UserFamilyRelation[] = [
    {
      familyId: 'family-1',
      familyName: '家族1',
      familyIconURL: null,
      role: 'admin',
      relation: 'お父さん',
      joinedAt: new Date(),
      lastViewedAt: new Date(),
      unreadPostCount: 3,
    },
    {
      familyId: 'family-2',
      familyName: '家族2',
      familyIconURL: null,
      role: 'child',
      relation: 'お兄ちゃん',
      joinedAt: new Date(),
      lastViewedAt: new Date(),
      unreadPostCount: 0,
    },
  ];

  it('should render all families', () => {
    const { getByText } = render(<FamilyList families={mockFamilies} />);

    expect(getByText('家族1')).toBeTruthy();
    expect(getByText('家族2')).toBeTruthy();
  });

  it('should call onFamilyPress when a family is pressed', () => {
    const onFamilyPress = jest.fn();
    const { getByText } = render(
      <FamilyList families={mockFamilies} onFamilyPress={onFamilyPress} />
    );

    fireEvent.press(getByText('家族1'));
    expect(onFamilyPress).toHaveBeenCalledWith(mockFamilies[0]);
  });

  it('should show empty state when no families', () => {
    const { getByText } = render(<FamilyList families={[]} />);

    expect(getByText('ファミリーがありません')).toBeTruthy();
  });

  it('should show loading indicator when loading', () => {
    const { getByTestId } = render(
      <FamilyList families={[]} loading={true} />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should call onRefresh when pulled to refresh', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <FamilyList
        families={mockFamilies}
        onRefresh={onRefresh}
        testID="family-list"
      />
    );

    const flatList = getByTestId('family-list');
    fireEvent(flatList, 'refresh');
    expect(onRefresh).toHaveBeenCalled();
  });
});
