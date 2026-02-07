import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { InviteCodeModal } from '@components/family/InviteCodeModal';
import type { InviteCode } from '@/src/types/family';

describe('InviteCodeModal', () => {
  const mockInviteCode: InviteCode = {
    id: 'invite-1',
    familyId: 'family-1',
    code: 'ABC123',
    createdAt: new Date(),
    createdBy: 'user-1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxUses: 1,
    usedCount: 0,
    usedBy: [],
    isActive: true,
  };

  it('should render when visible', () => {
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
      />
    );

    expect(getByText('招待コード')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <InviteCodeModal
        visible={false}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
      />
    );

    expect(queryByText('招待コード')).toBeNull();
  });

  it('should show loading state while generating code', () => {
    const { getByTestId } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
      />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should display generated invite code', async () => {
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={mockInviteCode}
      />
    );

    expect(getByText('ABC123')).toBeTruthy();
  });

  it('should display expiry date', async () => {
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={mockInviteCode}
      />
    );

    expect(getByText(/有効期限/)).toBeTruthy();
  });

  it('should copy code to clipboard when copy button is pressed', async () => {
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={mockInviteCode}
      />
    );

    fireEvent.press(getByText('コードをコピー'));

    await waitFor(() => {
      expect(getByText('コピーしました')).toBeTruthy();
    });
  });

  it('should share invite code when share button is pressed', async () => {
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={mockInviteCode}
      />
    );

    fireEvent.press(getByText('共有'));

    // Share functionality should be triggered
    // In real implementation, this would open share sheet
  });

  it('should show usage count', () => {
    const usedCode = { ...mockInviteCode, usedCount: 1, maxUses: 5 };
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={usedCode}
      />
    );

    expect(getByText('使用回数: 1 / 5')).toBeTruthy();
  });

  it('should allow generating new code', async () => {
    const onNewCode = jest.fn();
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={mockInviteCode}
        onNewCode={onNewCode}
      />
    );

    fireEvent.press(getByText('新しいコードを生成'));

    await waitFor(() => {
      expect(onNewCode).toHaveBeenCalled();
    });
  });

  it('should call onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={onClose}
        existingCode={mockInviteCode}
      />
    );

    fireEvent.press(getByText('閉じる'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show deactivate button for active codes', () => {
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={mockInviteCode}
      />
    );

    expect(getByText('無効化')).toBeTruthy();
  });

  it('should show inactive status for deactivated codes', () => {
    const inactiveCode = { ...mockInviteCode, isActive: false };
    const { getByText } = render(
      <InviteCodeModal
        visible={true}
        familyId="family-1"
        userId="user-1"
        onClose={jest.fn()}
        existingCode={inactiveCode}
      />
    );

    expect(getByText('無効')).toBeTruthy();
  });
});
