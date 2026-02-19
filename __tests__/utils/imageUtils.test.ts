import {
  resizeImage,
  resizeImages,
  getImageSize,
  formatImageSize,
  getFileNameFromUri,
  generateImageId,
} from '@/utils/imageUtils';
import * as ImageManipulator from 'expo-image-manipulator';

// expo-image-manipulatorのモック
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png',
  },
}));

describe('imageUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resizeImage', () => {
    it('画像をリサイズする', async () => {
      const mockUri = 'file:///path/to/image.jpg';
      const mockResizedUri = 'file:///path/to/resized.jpg';

      // 元画像のサイズ取得
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: mockUri,
        width: 3000,
        height: 2000,
      });

      // リサイズ後
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: mockResizedUri,
        width: 1920,
        height: 1280,
      });

      const result = await resizeImage(mockUri);

      expect(result).toBe(mockResizedUri);
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(2);
    });

    it('最大サイズ以下の画像は品質圧縮のみ行う', async () => {
      const mockUri = 'file:///path/to/small.jpg';
      const mockCompressedUri = 'file:///path/to/compressed.jpg';

      // 元画像のサイズ取得
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: mockUri,
        width: 1000,
        height: 800,
      });

      // 圧縮のみ
      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: mockCompressedUri,
        width: 1000,
        height: 800,
      });

      const result = await resizeImage(mockUri, { maxWidth: 1920, maxHeight: 1920 });

      expect(result).toBe(mockCompressedUri);
      // リサイズなし、圧縮のみなので2回呼ばれる
      expect(ImageManipulator.manipulateAsync).toHaveBeenCalledTimes(2);
      expect(ImageManipulator.manipulateAsync).toHaveBeenLastCalledWith(
        mockUri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
    });

    it('カスタムオプションを適用できる', async () => {
      const mockUri = 'file:///path/to/image.jpg';
      const mockResizedUri = 'file:///path/to/resized.jpg';

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: mockUri,
        width: 2000,
        height: 1500,
      });

      (ImageManipulator.manipulateAsync as jest.Mock).mockResolvedValueOnce({
        uri: mockResizedUri,
        width: 1024,
        height: 768,
      });

      await resizeImage(mockUri, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.9,
      });

      expect(ImageManipulator.manipulateAsync).toHaveBeenLastCalledWith(
        mockUri,
        [{ resize: { width: 1024, height: 768 } }],
        {
          compress: 0.9,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
    });

    it('エラー時は適切なエラーメッセージを投げる', async () => {
      (ImageManipulator.manipulateAsync as jest.Mock).mockRejectedValue(
        new Error('Manipulation failed')
      );

      await expect(resizeImage('invalid-uri')).rejects.toThrow(
        '画像のリサイズに失敗しました'
      );
    });
  });

  describe('resizeImages', () => {
    it.skip('複数の画像を一括でリサイズする', async () => {
      const mockUris = [
        'file:///path/to/image1.jpg',
        'file:///path/to/image2.jpg',
      ];

      // 各画像に対して、サイズ取得と圧縮の2回呼び出される
      // 画像1: サイズ取得
      (ImageManipulator.manipulateAsync as jest.Mock)
        .mockResolvedValueOnce({ uri: mockUris[0], width: 800, height: 600 })
        // 画像1: 圧縮のみ (サイズ以下なので)
        .mockResolvedValueOnce({ uri: 'file:///resized1.jpg', width: 800, height: 600 })
        // 画像2: サイズ取得
        .mockResolvedValueOnce({ uri: mockUris[1], width: 900, height: 700 })
        // 画像2: 圧縮のみ (サイズ以下なので)
        .mockResolvedValueOnce({ uri: 'file:///resized2.jpg', width: 900, height: 700 });

      const results = await resizeImages(mockUris);

      expect(results).toHaveLength(2);
      expect(results[0]).toBe('file:///resized1.jpg');
      expect(results[1]).toBe('file:///resized2.jpg');
    });
  });

  describe('formatImageSize', () => {
    it('バイト数を人間が読める形式に変換する', () => {
      expect(formatImageSize(0)).toBe('0 Bytes');
      expect(formatImageSize(1024)).toBe('1 KB');
      expect(formatImageSize(1024 * 1024)).toBe('1 MB');
      expect(formatImageSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatImageSize(1536 * 1024)).toBe('1.5 MB');
      expect(formatImageSize(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });
  });

  describe('getFileNameFromUri', () => {
    it('URIからファイル名を抽出する', () => {
      expect(getFileNameFromUri('file:///path/to/image.jpg')).toBe('image.jpg');
      expect(getFileNameFromUri('file:///some/long/path/photo.png')).toBe('photo.png');
      expect(getFileNameFromUri('content://media/external/images/1234')).toBe('1234');
    });

    it('ファイル名がない場合はデフォルト値を返す', () => {
      expect(getFileNameFromUri('file:///')).toBe('image.jpg');
      expect(getFileNameFromUri('')).toBe('image.jpg');
    });
  });

  describe('generateImageId', () => {
    it('一意のIDを生成する', () => {
      const id1 = generateImageId();
      const id2 = generateImageId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('タイムスタンプとランダム文字列を含む', () => {
      const id = generateImageId();
      const parts = id.split('_');

      expect(parts).toHaveLength(2);
      expect(Number(parts[0])).toBeGreaterThan(0); // タイムスタンプ
      expect(parts[1]).toHaveLength(7); // ランダム文字列
    });
  });
});
