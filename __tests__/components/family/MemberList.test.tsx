import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MemberList } from '@components/family/MemberList';
import type { FamilyMember } from '@/src/types/family';

describe('MemberList', () => {
  const mockMembers: FamilyMember[] = [
    {
      userId: 'user-1',
      displayName: '田中太郎',
      photoURL: null,
      relation: 'お父さん',
      role: 'admin',
      joinedAt: new Date(),
      invitedBy: null,
    },
    {
      userId: 'user-2',
      displayName: '田中花子',
      photoURL: null,
      relation: 'お母さん',
      role: 'admin',
      joinedAt: new Date(),
      invitedBy: 'user-1',
    },
    {
      userId: 'user-3',
      displayName: '田中次郎',
      photoURL: null,
      relation: '息子',
      role: 'child',
      joinedAt: new Date(),
      invitedBy: 'user-1',
    },
  ];

  it('should render all members', () => {
    const { getByText } = render(<MemberList members={mockMembers} />);

    expect(getByText('田中太郎')).toBeTruthy();
    expect(getByText('田中花子')).toBeTruthy();
    expect(getByText('田中次郎')).toBeTruthy();
  });

  it('should group members by role (admins first)', () => {
    const { getAllByTestId } = render(
      <MemberList members={mockMembers} testID="member-list" />
    );

    const memberCards = getAllByTestId(/member-card/);
    expect(memberCards.length).toBe(3);
  });

  it('should show admin badge for admin members', () => {
    const { getAllByText } = render(<MemberList members={mockMembers} />);

    const adminBadges = getAllByText('管理者');
    expect(adminBadges.length).toBe(2);
  });

  it('should call onMemberPress when a member is pressed', () => {
    const onMemberPress = jest.fn();
    const { getByText } = render(
      <MemberList members={mockMembers} onMemberPress={onMemberPress} />
    );

    fireEvent.press(getByText('田中太郎'));
    expect(onMemberPress).toHaveBeenCalledWith(mockMembers[0]);
  });

  it('should show empty state when no members', () => {
    const { getByText } = render(<MemberList members={[]} />);

    expect(getByText('メンバーがいません')).toBeTruthy();
  });

  it('should show loading indicator when loading', () => {
    const { getByTestId } = render(<MemberList members={[]} loading={true} />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
