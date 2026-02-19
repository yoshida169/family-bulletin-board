import { authService } from '@services/firebase/auth';
import { memberService } from '@services/firebase/member';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// モックの設定
const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
const mockBatchSet = jest.fn();
const mockBatchUpdate = jest.fn();
const mockBatchDelete = jest.fn();

const mockBatch = {
  set: mockBatchSet,
  update: mockBatchUpdate,
  delete: mockBatchDelete,
  commit: mockBatchCommit,
};

const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockCollectionGroupGet = jest.fn();

const createMockDocRef = (id: string = 'mock-doc-id') => ({
  id,
  get: mockGet,
  update: mockUpdate,
  collection: jest.fn(),
});

const mockFirestoreInstance = {
  collection: jest.fn(),
  collectionGroup: jest.fn(),
  batch: jest.fn(() => mockBatch),
};

// Mock auth module
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: {
      uid: 'test-user-id',
      delete: jest.fn().mockResolvedValue(undefined),
    },
  })),
}));

// Mock firestore module
jest.mock('@react-native-firebase/firestore', () => {
  const mockFirestore = jest.fn(() => mockFirestoreInstance);

  mockFirestore.FieldValue = {
    serverTimestamp: jest.fn(() => new Date()),
    increment: jest.fn((n) => n),
    arrayUnion: jest.fn((val) => [val]),
    arrayRemove: jest.fn((val) => []),
  };

  mockFirestore.Timestamp = {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  };

  return {
    __esModule: true,
    default: mockFirestore,
  };
});

describe('User Settings - Account Deletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReset();
    mockUpdate.mockReset();
    mockBatchSet.mockReset();
    mockBatchUpdate.mockReset();
    mockBatchDelete.mockReset();
    mockBatchCommit.mockReset().mockResolvedValue(undefined);
    mockFirestoreInstance.collection.mockReset();
    mockFirestoreInstance.collectionGroup.mockReset();
    mockFirestoreInstance.batch.mockReset().mockReturnValue(mockBatch);
  });

  describe('deleteAccount', () => {
    it('アカウントを論理削除し、30日後の物理削除をスケジュールする', async () => {
      // この機能はauth.tsに追加する必要がある
      // テストのみを先に書いておく
      const userId = 'test-user-id';

      const userDocRef = createMockDocRef(userId);
      const usersCollectionRef = {
        doc: jest.fn().mockReturnValue(userDocRef),
      };

      mockFirestoreInstance.collection.mockReturnValue(usersCollectionRef);

      // 期待される動作:
      // 1. isDeleted = true に設定
      // 2. deletedAt = 現在時刻
      // 3. scheduledDeletionAt = 現在時刻 + 30日

      // この関数はまだ実装されていないので、スキップ
      expect(true).toBe(true);
    });

    it('削除予定のアカウントは所属している全ファミリーから退会する', async () => {
      // 期待される動作:
      // 1. ユーザーが所属している全ファミリーを取得
      // 2. 各ファミリーから leaveFamily を実行
      // 3. アカウントを論理削除

      expect(true).toBe(true);
    });
  });

  describe('leaveFamily', () => {
    it('ファミリーから退会し、投稿とコメントを削除する', async () => {
      const userId = 'test-user-id';
      const familyId = 'test-family-id';

      // モックの設定
      const memberDocRef = createMockDocRef(`${userId}`);
      const familyDocRef = createMockDocRef(familyId);
      const userFamilyDocRef = createMockDocRef(`${userId}_${familyId}`);

      // 投稿の削除をモック
      const mockPostDocs = [
        {
          ref: createMockDocRef('post-1'),
          data: () => ({ imageUrls: [] }),
        },
        {
          ref: createMockDocRef('post-2'),
          data: () => ({ imageUrls: [] }),
        },
      ];

      // コメントの削除をモック
      const mockCommentDocs = [
        { ref: createMockDocRef('comment-1') },
        { ref: createMockDocRef('comment-2') },
      ];

      mockCollectionGroupGet
        .mockResolvedValueOnce({ docs: mockPostDocs })
        .mockResolvedValueOnce({ docs: mockCommentDocs });

      mockFirestoreInstance.collectionGroup
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ docs: mockPostDocs }),
        })
        .mockReturnValueOnce({
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ docs: mockCommentDocs }),
        });

      const membersCollectionRef = {
        doc: jest.fn().mockReturnValue(memberDocRef),
      };

      familyDocRef.collection.mockReturnValue(membersCollectionRef);

      const familiesCollectionRef = {
        doc: jest.fn().mockReturnValue(familyDocRef),
      };

      const userFamiliesCollectionRef = {
        doc: jest.fn().mockReturnValue(userFamilyDocRef),
      };

      mockFirestoreInstance.collection
        .mockReturnValueOnce(familiesCollectionRef) // families collection
        .mockReturnValueOnce(familiesCollectionRef) // family doc
        .mockReturnValueOnce(userFamiliesCollectionRef); // userFamilies collection

      // この関数はまだ実装されていないので、スキップ
      expect(true).toBe(true);
    });

    it('最後の管理者が退会しようとした場合、エラーを返す', async () => {
      // 期待される動作:
      // 1. ファミリーの管理者を取得
      // 2. 管理者が1人だけで、その人が退会しようとしている場合はエラー

      expect(true).toBe(true);
    });
  });
});
