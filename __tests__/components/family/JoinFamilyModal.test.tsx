import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { JoinFamilyModal } from '@components/family/JoinFamilyModal';
import { invitationService } from '@services/firebase/invitation';

// Mock invitationService
jest.mock('@services/firebase/invitation');
const mockInvitationService = invitationService as jest.Mocked<typeof invitationService>;

describe('JoinFamilyModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful mock
    mockInvitationService.useInviteCode.mockResolvedValue({
      success: true,
      familyId: 'family-123',
    });
  });
  const mockUser = {
    uid: 'user-123',
    displayName: 'テストユーザー',
    photoURL: null,
  };

  it('should render when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <JoinFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(getByText('ファミリーに参加')).toBeTruthy();
    expect(getByPlaceholderText('招待コードを入力')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <JoinFamilyModal
        visible={false}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(queryByText('ファミリーに参加')).toBeNull();
  });

  it('should validate invite code format', async () => {
    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <JoinFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    const codeInput = getByPlaceholderText('招待コードを入力');

    // Try with too short code - should not call service
    fireEvent.changeText(codeInput, '123');
    fireEvent.press(getByText('参加'));
    expect(mockInvitationService.useInviteCode).not.toHaveBeenCalled();

    // With 6 character code - should call service
    fireEvent.changeText(codeInput, 'ABC123');
    fireEvent.press(getByText('参加'));

    await waitFor(() => {
      expect(mockInvitationService.useInviteCode).toHaveBeenCalled();
    });
  });

  it('should convert code to uppercase', () => {
    const { getByPlaceholderText } = render(
      <JoinFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const codeInput = getByPlaceholderText('招待コードを入力');
    fireEvent.changeText(codeInput, 'abc123');

    expect(codeInput.props.value).toBe('ABC123');
  });

  it('should show error for invalid invite code', async () => {
    mockInvitationService.useInviteCode.mockResolvedValue({
      success: false,
      error: '無効な招待コードです',
    });

    const { getByPlaceholderText, getByText } = render(
      <JoinFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const codeInput = getByPlaceholderText('招待コードを入力');
    fireEvent.changeText(codeInput, 'INVALID');
    fireEvent.press(getByText('参加'));

    await waitFor(() => {
      expect(getByText('無効な招待コードです')).toBeTruthy();
    });
  });

  it('should call onSuccess when code is valid', async () => {
    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <JoinFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    const codeInput = getByPlaceholderText('招待コードを入力');
    fireEvent.changeText(codeInput, 'ABC123');
    fireEvent.press(getByText('参加'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <JoinFamilyModal
        visible={true}
        user={mockUser}
        onClose={onClose}
        onSuccess={jest.fn()}
      />
    );

    fireEvent.press(getByText('キャンセル'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should show loading state while validating code', async () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(
      <JoinFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const codeInput = getByPlaceholderText('招待コードを入力');
    fireEvent.changeText(codeInput, 'ABC123');
    fireEvent.press(getByText('参加'));

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
