import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateFamilyModal } from '@components/family/CreateFamilyModal';
import { familyService } from '@services/firebase/family';

// Mock familyService
jest.mock('@services/firebase/family');
const mockFamilyService = familyService as jest.Mocked<typeof familyService>;

describe('CreateFamilyModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful mock
    mockFamilyService.createFamily.mockResolvedValue({
      id: 'new-family',
      name: 'Test Family',
      description: null,
      iconURL: null,
      ownerId: 'user-123',
      adminIds: ['user-123'],
      memberCount: 1,
      postCount: 0,
      settings: {
        allowChildrenToPost: true,
        allowChildrenToComment: true,
        requireApprovalForPosts: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });
  const mockUser = {
    uid: 'user-123',
    displayName: 'テストユーザー',
    photoURL: null,
  };

  it('should render when visible', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(getByText('ファミリーを作成')).toBeTruthy();
    expect(getByPlaceholderText('ファミリー名')).toBeTruthy();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(
      <CreateFamilyModal
        visible={false}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(queryByText('ファミリーを作成')).toBeNull();
  });

  it('should show validation error for empty name', async () => {
    const { getByText } = render(
      <CreateFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    fireEvent.press(getByText('作成'));

    await waitFor(() => {
      expect(getByText('ファミリー名を入力してください')).toBeTruthy();
    });
  });

  it('should show validation error for name too long', async () => {
    const { getByPlaceholderText, getByText } = render(
      <CreateFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const nameInput = getByPlaceholderText('ファミリー名');
    fireEvent.changeText(nameInput, 'あ'.repeat(51));
    fireEvent.press(getByText('作成'));

    await waitFor(() => {
      expect(getByText('ファミリー名は50文字以内で入力してください')).toBeTruthy();
    });
  });

  it('should call onSuccess when family is created', async () => {
    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <CreateFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    const nameInput = getByPlaceholderText('ファミリー名');
    fireEvent.changeText(nameInput, '新しいファミリー');

    // Select relation
    fireEvent.press(getByText('お父さん'));

    fireEvent.press(getByText('作成'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('should call onClose when cancel is pressed', () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <CreateFamilyModal
        visible={true}
        user={mockUser}
        onClose={onClose}
        onSuccess={jest.fn()}
      />
    );

    fireEvent.press(getByText('キャンセル'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should reset form when modal is closed and reopened', async () => {
    const { getByPlaceholderText, rerender } = render(
      <CreateFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const nameInput = getByPlaceholderText('ファミリー名');
    fireEvent.changeText(nameInput, 'テスト');

    rerender(
      <CreateFamilyModal
        visible={false}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    rerender(
      <CreateFamilyModal
        visible={true}
        user={mockUser}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    expect(getByPlaceholderText('ファミリー名').props.value).toBe('');
  });
});
