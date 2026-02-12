import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ImagePicker } from '@/components/board/ImagePicker';
import * as ExpoImagePicker from 'expo-image-picker';

// モック
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

describe('ImagePicker', () => {
  const mockOnImagesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画像が選択されていない場合、ヘルプテキストを表示する', () => {
    const { getByText } = render(
      <ImagePicker images={[]} onImagesChange={mockOnImagesChange} maxImages={3} />
    );

    expect(getByText('画像は最大3枚まで添付できます')).toBeTruthy();
  });

  it('選択済み画像のプレビューを表示する', () => {
    const images = ['file:///image1.jpg', 'file:///image2.jpg'];
    const { getByLabelText } = render(
      <ImagePicker images={images} onImagesChange={mockOnImagesChange} />
    );

    expect(getByLabelText('画像を削除')).toBeTruthy();
  });

  it('画像追加ボタンを表示する', () => {
    const { getByLabelText } = render(
      <ImagePicker images={[]} onImagesChange={mockOnImagesChange} />
    );

    expect(getByLabelText('画像を追加')).toBeTruthy();
  });

  it('最大枚数に達したら画像追加ボタンを非表示にする', () => {
    const images = ['file:///image1.jpg', 'file:///image2.jpg', 'file:///image3.jpg'];
    const { queryByLabelText } = render(
      <ImagePicker images={images} onImagesChange={mockOnImagesChange} maxImages={3} />
    );

    expect(queryByLabelText('画像を追加')).toBeNull();
  });

  it('画像追加ボタンをタップすると選択方法を選ぶアラートが表示される', () => {
    const { getByLabelText } = render(
      <ImagePicker images={[]} onImagesChange={mockOnImagesChange} />
    );

    fireEvent.press(getByLabelText('画像を追加'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '画像を選択',
      '画像の選択方法を選んでください',
      expect.any(Array)
    );
  });

  it('画像削除ボタンをタップすると画像が削除される', () => {
    const images = ['file:///image1.jpg'];
    const { getByLabelText } = render(
      <ImagePicker images={images} onImagesChange={mockOnImagesChange} />
    );

    fireEvent.press(getByLabelText('画像を削除'));

    expect(mockOnImagesChange).toHaveBeenCalledWith([]);
  });

  it('無効状態では操作できない', () => {
    const { getByLabelText } = render(
      <ImagePicker images={[]} onImagesChange={mockOnImagesChange} disabled />
    );

    fireEvent.press(getByLabelText('画像を追加'));

    expect(Alert.alert).not.toHaveBeenCalled();
  });

  describe('フォトライブラリから選択', () => {
    it('権限が許可されている場合、画像を選択できる', async () => {
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///selected.jpg' }],
      });

      const { getByLabelText } = render(
        <ImagePicker images={[]} onImagesChange={mockOnImagesChange} />
      );

      fireEvent.press(getByLabelText('画像を追加'));

      // アラートのコールバックを実行
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const libraryButton = buttons.find((b: any) => b.text === 'フォトライブラリから選択');
      await libraryButton.onPress();

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(['file:///selected.jpg']);
      });
    });

    it('権限が拒否された場合、エラーアラートを表示する', async () => {
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByLabelText } = render(
        <ImagePicker images={[]} onImagesChange={mockOnImagesChange} />
      );

      fireEvent.press(getByLabelText('画像を追加'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const libraryButton = buttons.find((b: any) => b.text === 'フォトライブラリから選択');
      await libraryButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '権限が必要です',
          'フォトライブラリへのアクセス権限が必要です。設定から権限を許可してください。'
        );
      });
    });

    it('選択がキャンセルされた場合、何もしない', async () => {
      (ExpoImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (ExpoImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByLabelText } = render(
        <ImagePicker images={[]} onImagesChange={mockOnImagesChange} />
      );

      fireEvent.press(getByLabelText('画像を追加'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const libraryButton = buttons.find((b: any) => b.text === 'フォトライブラリから選択');
      await libraryButton.onPress();

      await waitFor(() => {
        expect(mockOnImagesChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('カメラで撮影', () => {
    it('権限が許可されている場合、写真を撮影できる', async () => {
      (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (ExpoImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file:///photo.jpg' }],
      });

      const { getByLabelText } = render(
        <ImagePicker images={[]} onImagesChange={mockOnImagesChange} />
      );

      fireEvent.press(getByLabelText('画像を追加'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const cameraButton = buttons.find((b: any) => b.text === 'カメラで撮影');
      await cameraButton.onPress();

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(['file:///photo.jpg']);
      });
    });

    it('権限が拒否された場合、エラーアラートを表示する', async () => {
      (ExpoImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByLabelText } = render(
        <ImagePicker images={[]} onImagesChange={mockOnImagesChange} />
      );

      fireEvent.press(getByLabelText('画像を追加'));

      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      const cameraButton = buttons.find((b: any) => b.text === 'カメラで撮影');
      await cameraButton.onPress();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '権限が必要です',
          'カメラへのアクセス権限が必要です。設定から権限を許可してください。'
        );
      });
    });
  });
});
