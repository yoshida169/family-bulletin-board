import {
  uploadPostImage,
  uploadCommentImage,
  uploadFamilyIcon,
  uploadUserProfile,
  deleteImage,
  deleteImages,
  deletePostImages,
} from '@/services/firebase/storage';
import { storage } from '@/services/firebase/config';
import { resizeImage } from '@/utils/imageUtils';

// モック
jest.mock('@/services/firebase/config', () => ({
  storage: jest.fn(() => ({
    ref: jest.fn(),
    refFromURL: jest.fn(),
  })),
}));

jest.mock('@/utils/imageUtils', () => ({
  resizeImage: jest.fn(),
}));

describe('storageService', () => {
  const mockStorage = storage as jest.MockedFunction<typeof storage>;
  const mockResizeImage = resizeImage as jest.MockedFunction<typeof resizeImage>;

  let mockRef: any;
  let mockTask: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // モックのセットアップ
    mockRef = {
      putFile: jest.fn(),
      getDownloadURL: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
    };

    mockTask = Promise.resolve();

    mockRef.putFile.mockReturnValue(mockTask);
    mockRef.getDownloadURL.mockResolvedValue('https://storage.example.com/image.jpg');

    mockStorage.mockReturnValue({
      ref: jest.fn(() => mockRef),
      refFromURL: jest.fn(() => mockRef),
    } as any);

    mockResizeImage.mockResolvedValue('file:///resized.jpg');
  });

  describe('uploadPostImage', () => {
    it('投稿画像をアップロードする', async () => {
      const familyId = 'family1';
      const boardId = 'board1';
      const postId = 'post1';
      const imageUri = 'file:///original.jpg';
      const imageId = 'image1';

      const downloadUrl = await uploadPostImage(
        familyId,
        boardId,
        postId,
        imageUri,
        imageId
      );

      expect(mockResizeImage).toHaveBeenCalledWith(
        imageUri,
        { maxWidth: 1920, maxHeight: 1920, quality: 0.8 }
      );
      expect(mockRef.putFile).toHaveBeenCalledWith('file:///resized.jpg');
      expect(downloadUrl).toBe('https://storage.example.com/image.jpg');
    });

    it('正しいStorageパスを使用する', async () => {
      const familyId = 'family1';
      const boardId = 'board1';
      const postId = 'post1';
      const imageUri = 'file:///original.jpg';
      const imageId = 'image1';

      await uploadPostImage(familyId, boardId, postId, imageUri, imageId);

      const expectedPath = 'families/family1/boards/board1/posts/post1/image1.jpg';
      expect(mockStorage().ref).toHaveBeenCalledWith(expectedPath);
    });

    it('リサイズを無効化できる', async () => {
      const imageUri = 'file:///original.jpg';

      await uploadPostImage('f1', 'b1', 'p1', imageUri, 'i1', { resize: false });

      expect(mockResizeImage).not.toHaveBeenCalled();
      expect(mockRef.putFile).toHaveBeenCalledWith(imageUri);
    });

    it('エラー時は適切なエラーメッセージを投げる', async () => {
      mockRef.putFile.mockRejectedValue(new Error('Upload failed'));

      await expect(
        uploadPostImage('f1', 'b1', 'p1', 'file:///image.jpg', 'i1')
      ).rejects.toThrow('画像のアップロードに失敗しました');
    });
  });

  describe('uploadCommentImage', () => {
    it('コメント画像をアップロードする', async () => {
      const familyId = 'family1';
      const boardId = 'board1';
      const postId = 'post1';
      const commentId = 'comment1';
      const imageUri = 'file:///original.jpg';
      const imageId = 'image1';

      const downloadUrl = await uploadCommentImage(
        familyId,
        boardId,
        postId,
        commentId,
        imageUri,
        imageId
      );

      expect(downloadUrl).toBe('https://storage.example.com/image.jpg');

      const expectedPath = 'families/family1/boards/board1/posts/post1/comments/comment1/image1.jpg';
      expect(mockStorage().ref).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('uploadFamilyIcon', () => {
    it('ファミリーアイコンをアップロードする', async () => {
      const familyId = 'family1';
      const imageUri = 'file:///icon.jpg';

      const downloadUrl = await uploadFamilyIcon(familyId, imageUri);

      expect(mockResizeImage).toHaveBeenCalledWith(
        imageUri,
        { maxWidth: 512, maxHeight: 512, quality: 0.9 }
      );
      expect(downloadUrl).toBe('https://storage.example.com/image.jpg');

      const expectedPath = 'families/family1/icon/family1.jpg';
      expect(mockStorage().ref).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('uploadUserProfile', () => {
    it('ユーザープロフィール画像をアップロードする', async () => {
      const userId = 'user1';
      const imageUri = 'file:///profile.jpg';

      const downloadUrl = await uploadUserProfile(userId, imageUri);

      expect(mockResizeImage).toHaveBeenCalledWith(
        imageUri,
        { maxWidth: 512, maxHeight: 512, quality: 0.9 }
      );
      expect(downloadUrl).toBe('https://storage.example.com/image.jpg');

      const expectedPath = 'users/user1/profile/user1.jpg';
      expect(mockStorage().ref).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('deleteImage', () => {
    it('画像を削除する', async () => {
      const imageUrl = 'https://storage.example.com/image.jpg';

      await deleteImage(imageUrl);

      expect(mockStorage().refFromURL).toHaveBeenCalledWith(imageUrl);
      expect(mockRef.delete).toHaveBeenCalled();
    });

    it('エラー時は適切なエラーメッセージを投げる', async () => {
      mockRef.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(
        deleteImage('https://storage.example.com/image.jpg')
      ).rejects.toThrow('画像の削除に失敗しました');
    });
  });

  describe('deleteImages', () => {
    it('複数の画像を削除する', async () => {
      const imageUrls = [
        'https://storage.example.com/image1.jpg',
        'https://storage.example.com/image2.jpg',
      ];

      await deleteImages(imageUrls);

      expect(mockRef.delete).toHaveBeenCalledTimes(2);
    });
  });

  describe('deletePostImages', () => {
    it('投稿の全画像を削除する', async () => {
      const familyId = 'family1';
      const boardId = 'board1';
      const postId = 'post1';

      const mockItems = [
        { delete: jest.fn().mockResolvedValue(undefined) },
        { delete: jest.fn().mockResolvedValue(undefined) },
      ];

      mockRef.listAll.mockResolvedValue({ items: mockItems });

      await deletePostImages(familyId, boardId, postId);

      const expectedPath = 'families/family1/boards/board1/posts/post1';
      expect(mockStorage().ref).toHaveBeenCalledWith(expectedPath);
      expect(mockRef.listAll).toHaveBeenCalled();
      expect(mockItems[0].delete).toHaveBeenCalled();
      expect(mockItems[1].delete).toHaveBeenCalled();
    });

    it('エラーが発生しても処理を続行する', async () => {
      mockRef.listAll.mockRejectedValue(new Error('List failed'));

      // エラーが投げられないことを確認
      await expect(deletePostImages('f1', 'b1', 'p1')).resolves.toBeUndefined();
    });
  });
});
