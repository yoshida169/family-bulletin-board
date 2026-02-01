# 実装計画

## 1. 目的

### 対象設計
- [design.md](design.md) - 家族の掲示板 設計書

### 実装範囲
- iOS / Android モバイルアプリ（React Native + Expo）
- 認証機能（メール、Google）
- ファミリー管理機能
- 掲示板機能（投稿、コメント、画像添付、ピン留め、既読管理）
- プッシュ通知機能
- チュートリアル機能

### 対象外（初期リリース）
- Instagram/X認証（後のフェーズで追加）
- Webアプリ

---

## 2. 依存関係

### 外部サービス
| サービス | 用途 |
|---------|------|
| Firebase Authentication | ユーザー認証 |
| Cloud Firestore | データベース |
| Cloud Storage for Firebase | 画像保存 |
| Firebase Cloud Messaging (FCM) | プッシュ通知 |
| Firebase Crashlytics | クラッシュレポート |
| Firebase Analytics | 利用状況分析 |
| Firebase Remote Config | 強制アップデートチェック |
| Google Cloud Functions | 通知送信トリガー |

### 事前に必要な設定
1. **Firebaseプロジェクト作成**
   - プロジェクト名: `family-bulletin-board`
   - iOS/Androidアプリ登録
   - `google-services.json` / `GoogleService-Info.plist` 取得

2. **Firebase Authentication設定**
   - メール/パスワード認証を有効化
   - Google認証を有効化（OAuth設定）

3. **Cloud Firestore設定**
   - ロケーション: `asia-northeast1`（東京）
   - Security Rules初期設定

4. **Cloud Storage設定**
   - バケット作成
   - Storage Security Rules設定

5. **FCM設定**
   - iOS: APNs証明書/キー設定
   - Android: FCM設定

6. **Expo設定**
   - `eas.json` 設定
   - iOS/Android ビルド設定

---

## 3. 実装タスク一覧

### フェーズ1: 基盤構築（優先度: 最高）

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 1-1 | Expoプロジェクト初期設定 | - | プロジェクト構成 |
| 1-2 | Firebase SDK統合 | 1-1 | Firebase初期化コード |
| 1-3 | ディレクトリ構成定義 | 1-1 | フォルダ構造 |
| 1-4 | 共通コンポーネント作成 | 1-3 | Button, Input, Card等 |
| 1-5 | ナビゲーション設定 | 1-3 | React Navigation設定 |
| 1-6 | 状態管理設定 | 1-3 | Context, Zustand設定 |
| 1-7 | テスト環境構築 | 1-1 | Jest, Detox設定 |

### フェーズ2: 認証機能

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 2-1 | スプラッシュ画面 | 1-5 | SplashScreen |
| 2-2 | ログイン画面 | 1-4 | LoginScreen |
| 2-3 | 新規登録画面 | 1-4 | SignUpScreen |
| 2-4 | パスワードリセット画面 | 1-4 | PasswordResetScreen |
| 2-5 | 認証状態管理 | 1-6 | AuthContext |
| 2-6 | メール認証実装 | 2-5 | signIn, signUp関数 |
| 2-7 | Google認証実装 | 2-5 | signInWithGoogle関数 |
| 2-8 | 認証ガード（ルート保護） | 2-5 | AuthGuard |
| 2-9 | Firestoreユーザードキュメント作成 | 2-6 | onAuthUserCreate |

### フェーズ3: ファミリー機能

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 3-1 | ファミリー一覧画面 | 2-8 | FamilyListScreen |
| 3-2 | ファミリー作成画面 | 3-1 | CreateFamilyScreen |
| 3-3 | ファミリー参加画面 | 3-1 | JoinFamilyScreen |
| 3-4 | ファミリーホーム画面 | 3-1 | FamilyHomeScreen |
| 3-5 | ファミリー設定画面 | 3-4 | FamilySettingsScreen |
| 3-6 | メンバー一覧画面 | 3-5 | MemberListScreen |
| 3-7 | 招待画面 | 3-5 | InviteScreen |
| 3-8 | ファミリーCRUD実装 | 3-2 | familyService |
| 3-9 | 招待コード生成/検証 | 3-7 | invitationService |
| 3-10 | メンバー管理（権限変更含む） | 3-6 | memberService |

### フェーズ4: 掲示板機能

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 4-1 | 掲示板一覧表示 | 3-4 | BoardList |
| 4-2 | 掲示板作成 | 4-1 | CreateBoardModal |
| 4-3 | 掲示板詳細画面 | 4-1 | BoardDetailScreen |
| 4-4 | 投稿一覧表示 | 4-3 | PostList |
| 4-5 | 投稿作成画面 | 4-3 | CreatePostScreen |
| 4-6 | 投稿編集画面 | 4-5 | EditPostScreen |
| 4-7 | 投稿詳細画面 | 4-4 | PostDetailScreen |
| 4-8 | コメント一覧/作成 | 4-7 | CommentSection |
| 4-9 | 投稿CRUD実装 | 4-5 | postService |
| 4-10 | コメントCRUD実装 | 4-8 | commentService |

### フェーズ5: 画像添付

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 5-1 | 画像ピッカー実装 | 4-5 | ImagePicker統合 |
| 5-2 | 画像リサイズ処理 | 5-1 | resizeImage関数 |
| 5-3 | Storageアップロード | 5-2 | uploadImage関数 |
| 5-4 | 画像プレビュー表示 | 4-4 | ImageGallery |
| 5-5 | 画像削除処理 | 5-3 | deleteImage関数 |

### フェーズ6: 既読/ピン留め

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 6-1 | 既読マーク処理 | 4-7 | markAsRead関数 |
| 6-2 | 未読バッジ表示 | 4-3 | UnreadBadge |
| 6-3 | ピン留め切り替え | 4-4 | togglePin関数 |
| 6-4 | ピン留め投稿の上部固定表示 | 4-4 | PinnedPostSection |

### フェーズ7: 検索機能

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 7-1 | 検索画面 | 4-3 | SearchScreen |
| 7-2 | 投稿検索実装 | 7-1 | searchPosts関数 |
| 7-3 | コメント検索実装 | 7-1 | searchComments関数 |
| 7-4 | 検索結果表示 | 7-1 | SearchResultList |

### フェーズ8: 通知機能

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 8-1 | FCMトークン取得/保存 | 2-5 | registerFCMToken関数 |
| 8-2 | 通知権限リクエスト | 8-1 | requestNotificationPermission |
| 8-3 | 通知設定画面 | 1-5 | NotificationSettingsScreen |
| 8-4 | ファミリー別通知設定 | 8-3 | FamilyNotificationSettings |
| 8-5 | Cloud Functions: 新規投稿通知 | 4-9 | onPostCreate |
| 8-6 | Cloud Functions: 新規コメント通知 | 4-10 | onCommentCreate |
| 8-7 | Cloud Functions: ファミリー参加通知 | 3-9 | onMemberJoin |
| 8-8 | フォアグラウンド通知表示 | 8-1 | NotificationHandler |

### フェーズ9: 設定機能

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 9-1 | 設定トップ画面 | 1-5 | SettingsScreen |
| 9-2 | プロフィール編集画面 | 9-1 | ProfileEditScreen |
| 9-3 | アカウント画面 | 9-1 | AccountScreen |
| 9-4 | ファミリー退会機能 | 9-3 | leaveFamily関数 |
| 9-5 | アカウント退会機能 | 9-3 | deleteAccount関数 |
| 9-6 | ログアウト機能 | 9-3 | signOut関数 |

### フェーズ10: チュートリアル

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 10-1 | チュートリアル画面 | 2-8 | TutorialScreen |
| 10-2 | 初回表示判定 | 10-1 | hasSeenTutorial |
| 10-3 | 設定からの再表示 | 9-1 | チュートリアル再表示 |

### フェーズ11: 非機能要件対応

| # | タスク | 依存 | 成果物 |
|---|-------|------|-------|
| 11-1 | オフラインキャッシュ設定 | 1-2 | Firestore永続化 |
| 11-2 | オフライン時UI制御 | 11-1 | OfflineIndicator |
| 11-3 | 強制アップデートチェック | 1-2 | ForceUpdateCheck |
| 11-4 | Crashlytics統合 | 1-2 | エラーレポート設定 |
| 11-5 | Analytics統合 | 1-2 | 画面/イベント計測 |
| 11-6 | アクセシビリティ対応 | 1-4 | accessibilityLabel設定 |
| 11-7 | Dynamic Type対応 | 1-4 | フォントスケール対応 |

---

## 4. データ実装

### Firestoreコレクション/サブコレクション

```
/users/{userId}
/families/{familyId}
/families/{familyId}/members/{memberId}
/families/{familyId}/boards/{boardId}
/families/{familyId}/boards/{boardId}/posts/{postId}
/families/{familyId}/boards/{boardId}/posts/{postId}/comments/{commentId}
/families/{familyId}/invitations/{invitationId}
```

### TypeScript型定義

```typescript
// src/types/models.ts

import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  displayName: string;
  profileImageUrl?: string;
  familyIds: string[];
  fcmTokens: string[];
  notificationSettings: NotificationSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

export interface NotificationSettings {
  newPost: boolean;
  newComment: boolean;
  familyInvite: boolean;
  // ファミリー別通知設定
  familySettings: {
    [familyId: string]: {
      enabled: boolean;
    };
  };
}

export interface Family {
  id: string;
  name: string;
  iconUrl?: string;
  ownerId: string;
  memberCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FamilyMember {
  id: string;
  userId: string;
  displayName: string;
  relationship: string;
  role: 'admin' | 'child';
  joinedAt: Timestamp;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  postCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Post {
  id: string;
  content: string;
  imageUrls: string[];
  authorId: string;
  authorName: string;
  isPinned: boolean;
  commentCount: number;
  readBy: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Comment {
  id: string;
  content: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  parentCommentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Invitation {
  id: string;
  code: string;
  familyId: string;
  createdBy: string;
  expiresAt: Timestamp;
  usedBy?: string;
  usedAt?: Timestamp;
  createdAt: Timestamp;
}
```

### Firestoreインデックス設定

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "fields": [
        { "fieldPath": "isPinned", "order": "DESCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "posts",
      "fields": [
        { "fieldPath": "authorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "fields": [
        { "fieldPath": "parentCommentId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "invitations",
      "fields": [
        { "fieldPath": "code", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### Storage構成

```
/families/{familyId}/
  /boards/{boardId}/
    /posts/{postId}/
      /{imageId}.jpg
    /comments/{commentId}/
      /{imageId}.jpg
  /icon/{familyId}.jpg
/users/{userId}/
  /profile/{userId}.jpg
```

### Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ヘルパー関数
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isFamilyMember(familyId) {
      return isAuthenticated() &&
        exists(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid));
    }

    function isFamilyAdmin(familyId) {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/families/$(familyId)/members/$(request.auth.uid)).data.role == 'admin';
    }

    function isPostAuthor(familyId, boardId, postId) {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/families/$(familyId)/boards/$(boardId)/posts/$(postId)).data.authorId == request.auth.uid;
    }

    function isCommentAuthor(familyId, boardId, postId, commentId) {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/families/$(familyId)/boards/$(boardId)/posts/$(postId)/comments/$(commentId)).data.authorId == request.auth.uid;
    }

    // バリデーション関数
    function isValidPost() {
      let data = request.resource.data;
      return data.content is string &&
             data.content.size() <= 1000 &&
             data.imageUrls is list &&
             data.imageUrls.size() <= 3;
    }

    function isValidInvitationCode() {
      let data = request.resource.data;
      return data.code is string &&
             data.code.size() == 6 &&
             data.code.matches('^[A-Z0-9]{6}$');
    }

    function canJoinMoreFamilies(userId) {
      let user = get(/databases/$(database)/documents/users/$(userId)).data;
      return user.familyIds.size() < 10; // ファミリー所属上限: 10
    }

    // ユーザー
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // ファミリー
    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow create: if isAuthenticated();
      allow update, delete: if isFamilyAdmin(familyId);

      // メンバー
      match /members/{memberId} {
        allow read: if isFamilyMember(familyId);
        allow create: if isAuthenticated() && canJoinMoreFamilies(memberId); // 招待コードで参加時（上限10ファミリー）
        allow update, delete: if isFamilyAdmin(familyId) || isOwner(memberId);
      }

      // 掲示板
      match /boards/{boardId} {
        allow read: if isFamilyMember(familyId);
        allow create, update, delete: if isFamilyAdmin(familyId);

        // 投稿
        match /posts/{postId} {
          allow read: if isFamilyMember(familyId);
          allow create: if isFamilyMember(familyId) && isValidPost();
          allow update: if (isPostAuthor(familyId, boardId, postId) || isFamilyAdmin(familyId)) && isValidPost();
          allow delete: if isPostAuthor(familyId, boardId, postId) || isFamilyAdmin(familyId);

          // コメント
          match /comments/{commentId} {
            allow read: if isFamilyMember(familyId);
            allow create: if isFamilyMember(familyId);
            allow update: if isCommentAuthor(familyId, boardId, postId, commentId);
            allow delete: if isCommentAuthor(familyId, boardId, postId, commentId) || isFamilyAdmin(familyId);
          }
        }
      }

      // 招待
      match /invitations/{invitationId} {
        allow read: if true; // 招待コード検証のため
        allow create: if isFamilyAdmin(familyId) && isValidInvitationCode();
        allow update: if isAuthenticated(); // 使用済みマーク用
      }
    }
  }
}
```

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isFamilyMember(familyId) {
      return firestore.exists(/databases/(default)/documents/families/$(familyId)/members/$(request.auth.uid));
    }

    function isValidImage() {
      return request.resource.size < 5 * 1024 * 1024 && // 5MB以下
             request.resource.contentType.matches('image/.*');
    }

    // ファミリー関連
    match /families/{familyId}/{allPaths=**} {
      allow read: if isAuthenticated() && isFamilyMember(familyId);
      allow write: if isAuthenticated() && isFamilyMember(familyId) && isValidImage();
    }

    // ユーザープロフィール
    match /users/{userId}/{allPaths=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId && isValidImage();
    }
  }
}
```

---

## 5. 画面実装

### ディレクトリ構成

```
src/
├── app/                        # Expo Router
│   ├── (auth)/                 # 認証が必要ない画面
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── password-reset.tsx
│   ├── (main)/                 # 認証が必要な画面
│   │   ├── (tabs)/
│   │   │   ├── families/
│   │   │   │   ├── index.tsx       # ファミリー一覧
│   │   │   │   ├── create.tsx      # ファミリー作成
│   │   │   │   ├── join.tsx        # ファミリー参加
│   │   │   │   └── [familyId]/
│   │   │   │       ├── index.tsx       # ファミリーホーム
│   │   │   │       ├── settings.tsx    # ファミリー設定
│   │   │   │       ├── members.tsx     # メンバー一覧
│   │   │   │       ├── invite.tsx      # 招待画面
│   │   │   │       └── boards/
│   │   │   │           └── [boardId]/
│   │   │   │               ├── index.tsx       # 掲示板詳細
│   │   │   │               ├── search.tsx      # 検索
│   │   │   │               ├── create-post.tsx # 投稿作成
│   │   │   │               └── posts/
│   │   │   │                   └── [postId]/
│   │   │   │                       ├── index.tsx   # 投稿詳細
│   │   │   │                       └── edit.tsx    # 投稿編集
│   │   │   └── settings/
│   │   │       ├── index.tsx           # 設定トップ
│   │   │       ├── profile.tsx         # プロフィール編集
│   │   │       ├── notifications.tsx   # 通知設定
│   │   │       └── account.tsx         # アカウント
│   │   └── tutorial.tsx
│   └── _layout.tsx
├── components/
│   ├── common/                 # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── OfflineIndicator.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── SocialLoginButtons.tsx
│   ├── family/
│   │   ├── FamilyCard.tsx
│   │   ├── MemberItem.tsx
│   │   ├── InviteCodeDisplay.tsx
│   │   └── InviteCodeInput.tsx
│   ├── board/
│   │   ├── BoardCard.tsx
│   │   ├── PostItem.tsx
│   │   ├── PostEditor.tsx
│   │   ├── CommentItem.tsx
│   │   ├── CommentInput.tsx
│   │   ├── ImageGallery.tsx
│   │   ├── ImagePicker.tsx
│   │   ├── UnreadBadge.tsx
│   │   └── PinnedPostSection.tsx
│   └── settings/
│       ├── SettingsItem.tsx
│       └── NotificationToggle.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── NetworkContext.tsx
├── stores/
│   ├── familyStore.ts          # Zustand
│   └── unreadStore.ts          # Zustand
├── services/
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   └── storage.ts
│   ├── authService.ts
│   ├── userService.ts
│   ├── familyService.ts
│   ├── memberService.ts
│   ├── boardService.ts
│   ├── postService.ts
│   ├── commentService.ts
│   ├── invitationService.ts
│   ├── imageService.ts
│   └── notificationService.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useFamily.ts
│   ├── useFamilies.ts
│   ├── useMembers.ts
│   ├── useBoards.ts
│   ├── usePosts.ts
│   ├── useComments.ts
│   ├── useImagePicker.ts
│   ├── useNetworkStatus.ts
│   └── useNotificationPermission.ts
├── utils/
│   ├── validation.ts
│   ├── formatters.ts
│   ├── imageUtils.ts
│   └── invitationCode.ts
├── constants/
│   ├── colors.ts
│   ├── layout.ts
│   └── messages.ts
└── types/
    ├── models.ts
    ├── navigation.ts
    └── api.ts
```

### 画面ごとのUI構成

| 画面 | 主要コンポーネント | 状態 |
|-----|------------------|------|
| ログイン | LoginForm, SocialLoginButtons | フォーム入力（email, password） |
| 新規登録 | SignUpForm, SocialLoginButtons | フォーム入力（email, password, displayName） |
| ファミリー一覧 | FamilyCard[], FAB | useFamilies() |
| ファミリー作成 | Input, ImagePicker, Button | フォーム入力（name, icon） |
| ファミリー参加 | InviteCodeInput, Button | 入力コード |
| ファミリーホーム | BoardCard[], FAB | useBoards(familyId) |
| 掲示板詳細 | PinnedPostSection, PostItem[], FAB | usePosts(boardId) |
| 投稿詳細 | PostContent, ImageGallery, CommentSection | usePost(postId), useComments(postId) |
| 投稿作成/編集 | PostEditor, ImagePicker | フォーム入力（content, images） |
| 設定トップ | SettingsItem[] | - |
| 通知設定 | NotificationToggle[] | useNotificationSettings() |

### 状態管理

```typescript
// src/contexts/AuthContext.tsx
interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

// src/stores/familyStore.ts (Zustand)
interface FamilyStore {
  currentFamilyId: string | null;
  setCurrentFamilyId: (id: string | null) => void;
}

// src/stores/unreadStore.ts (Zustand)
interface UnreadStore {
  unreadCounts: { [familyId: string]: { [boardId: string]: number } };
  setUnreadCount: (familyId: string, boardId: string, count: number) => void;
  incrementUnread: (familyId: string, boardId: string) => void;
  clearUnread: (familyId: string, boardId: string) => void;
}
```

### ナビゲーション

Expo Router を使用。認証状態による画面振り分け:

```typescript
// src/app/_layout.tsx
export default function RootLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" redirect={!!user} />
      <Stack.Screen name="(main)" redirect={!user} />
    </Stack>
  );
}
```

---

## 6. 権限/セキュリティ実装

### 役割と権限

| 操作 | admin | child | 実装箇所 |
|-----|:-----:|:-----:|---------|
| ファミリー編集 | ✓ | - | Security Rules + UI非表示 |
| ファミリー削除 | ✓ | - | Security Rules + UI非表示 |
| メンバー招待 | ✓ | - | Security Rules + UI非表示 |
| メンバー削除 | ✓ | - | Security Rules + UI非表示 |
| メンバー権限変更 | ✓ | - | Security Rules + UI非表示 |
| 掲示板作成/編集/削除 | ✓ | - | Security Rules + UI非表示 |
| 投稿作成 | ✓ | ✓ | Security Rules |
| 自分の投稿編集/削除 | ✓ | ✓ | Security Rules + UI条件表示 |
| 他人の投稿削除 | ✓ | - | Security Rules + UI条件表示 |
| 投稿ピン留め | ✓ | - | Security Rules + UI非表示 |
| コメント作成 | ✓ | ✓ | Security Rules |
| 自分のコメント削除 | ✓ | ✓ | Security Rules + UI条件表示 |
| 通知設定変更 | ✓ | ✓ | Security Rules |
| ファミリー退会 | ✓ | ✓ | Security Rules |

### 権限チェック実装

```typescript
// src/hooks/usePermission.ts
export function usePermission(familyId: string) {
  const { user } = useAuth();
  const { data: member } = useMember(familyId, user?.id);

  const isAdmin = member?.role === 'admin';
  const isOwner = (resourceAuthorId: string) => user?.id === resourceAuthorId;

  return {
    isAdmin,
    isOwner,
    canEditFamily: isAdmin,
    canDeleteFamily: isAdmin,
    canInviteMember: isAdmin,
    canRemoveMember: isAdmin,
    canCreateBoard: isAdmin,
    canEditBoard: isAdmin,
    canDeleteBoard: isAdmin,
    canPinPost: isAdmin,
    canEditPost: (authorId: string) => isOwner(authorId) || isAdmin,
    canDeletePost: (authorId: string) => isOwner(authorId) || isAdmin,
    canDeleteComment: (authorId: string) => isOwner(authorId) || isAdmin,
  };
}
```

### 退会時のデータ削除

```typescript
// functions/src/deleteUserData.ts (Cloud Functions)
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  const userId = user.uid;

  // ユーザードキュメントに deletedAt を設定
  await admin.firestore().collection('users').doc(userId).update({
    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // 30日後に物理削除をスケジュール（Cloud Schedulerで実行）
});

// ファミリー退会時
async function leaveFamily(userId: string, familyId: string) {
  const batch = admin.firestore().batch();

  // 1. ユーザーの投稿を削除
  const posts = await admin.firestore()
    .collectionGroup('posts')
    .where('authorId', '==', userId)
    .get();

  posts.docs.forEach(doc => {
    // Storageの画像も削除
    const post = doc.data();
    post.imageUrls.forEach(url => deleteStorageFile(url));
    batch.delete(doc.ref);
  });

  // 2. ユーザーのコメントを削除
  const comments = await admin.firestore()
    .collectionGroup('comments')
    .where('authorId', '==', userId)
    .get();

  comments.docs.forEach(doc => batch.delete(doc.ref));

  // 3. メンバーシップを削除
  batch.delete(admin.firestore()
    .collection('families').doc(familyId)
    .collection('members').doc(userId));

  // 4. ユーザーのfamilyIdsから削除
  batch.update(admin.firestore().collection('users').doc(userId), {
    familyIds: admin.firestore.FieldValue.arrayRemove(familyId),
  });

  // 5. ファミリーのmemberCountをデクリメント
  batch.update(admin.firestore().collection('families').doc(familyId), {
    memberCount: admin.firestore.FieldValue.increment(-1),
  });

  await batch.commit();
}
```

---

## 7. 非機能要件対応

### パフォーマンス

| 要件 | 対応実装 |
|-----|---------|
| 起動3秒以内 | スプラッシュ中にFirebase初期化、認証状態キャッシュ |
| 画面遷移1秒以内 | React Navigation preload、useSWR prefetch |
| 掲示板読み込み2秒以内 | ページネーション（20件）、Firestoreインデックス |
| 画像アップロード10秒以内 | クライアントリサイズ（1920px）、exponential-backoff |

```typescript
// 画像リサイズ
// src/utils/imageUtils.ts
import * as ImageManipulator from 'expo-image-manipulator';

export async function resizeImage(uri: string, maxSize: number = 1920) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxSize } }],
    { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}
```

### オフライン対応

```typescript
// src/services/firebase/config.ts
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';

const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

// src/hooks/useNetworkStatus.ts
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    return NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
  }, []);

  return isOnline;
}

// src/components/common/OfflineIndicator.tsx
export function OfflineIndicator() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <Text>オフラインです。一部機能が制限されます。</Text>
    </View>
  );
}
```

### アクセシビリティ

```typescript
// src/components/common/Button.tsx
export function Button({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { minWidth: 44, minHeight: 44 }, // タップ領域確保
        pressed && styles.pressed,
      ]}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text
        style={styles.label}
        allowFontScaling={true} // Dynamic Type対応
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
    </Pressable>
  );
}
```

---

## 8. テスト計画（TDD）

### 単体テスト

| 対象 | テストファイル | カバレッジ目標 |
|-----|--------------|---------------|
| バリデーション関数 | `validation.test.ts` | 100% |
| 招待コード生成 | `invitationCode.test.ts` | 100% |
| 画像リサイズ | `imageUtils.test.ts` | 90% |
| フォーマッター | `formatters.test.ts` | 90% |
| カスタムフック | `use*.test.ts` | 80% |
| 状態管理（Zustand） | `*Store.test.ts` | 80% |

```typescript
// __tests__/utils/validation.test.ts
describe('validateInvitationCode', () => {
  it('6桁英数字大文字を有効と判定する', () => {
    expect(validateInvitationCode('ABC123')).toBe(true);
  });

  it('小文字を含む場合は無効と判定する', () => {
    expect(validateInvitationCode('abc123')).toBe(false);
  });

  it('5桁以下を無効と判定する', () => {
    expect(validateInvitationCode('ABC12')).toBe(false);
  });

  it('7桁以上を無効と判定する', () => {
    expect(validateInvitationCode('ABC1234')).toBe(false);
  });

  it('記号を含む場合は無効と判定する', () => {
    expect(validateInvitationCode('ABC-12')).toBe(false);
  });
});

// __tests__/utils/invitationCode.test.ts
describe('generateInvitationCode', () => {
  it('6桁の英数字大文字を生成する', () => {
    const code = generateInvitationCode();
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('毎回異なるコードを生成する', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateInvitationCode()));
    expect(codes.size).toBe(100);
  });
});
```

### 統合テスト

| 対象 | テストファイル | ツール |
|-----|--------------|-------|
| Firestore CRUD | `firestore.integration.test.ts` | Firebase Emulator |
| Security Rules | `securityRules.test.ts` | @firebase/rules-unit-testing |
| 認証フロー | `auth.integration.test.ts` | Firebase Emulator |
| 画像アップロード | `storage.integration.test.ts` | Firebase Emulator |

```typescript
// __tests__/integration/securityRules.test.ts
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') },
    });
  });

  describe('users', () => {
    it('本人は自分のドキュメントを読み取れる', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      await assertSucceeds(db.collection('users').doc('user1').get());
    });

    it('他人のドキュメントは読み取れる（認証済みなら）', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      await assertSucceeds(db.collection('users').doc('user2').get());
    });

    it('他人のドキュメントは書き込めない', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      await assertFails(db.collection('users').doc('user2').set({ name: 'hacked' }));
    });
  });

  describe('posts', () => {
    it('ファミリーメンバーは投稿を作成できる', async () => {
      // メンバーシップをセットアップ
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore()
          .collection('families').doc('family1')
          .collection('members').doc('user1')
          .set({ role: 'child' });
      });

      const db = testEnv.authenticatedContext('user1').firestore();
      await assertSucceeds(
        db.collection('families').doc('family1')
          .collection('boards').doc('board1')
          .collection('posts').add({
            content: 'テスト投稿',
            imageUrls: [],
            authorId: 'user1',
            authorName: 'テストユーザー',
            isPinned: false,
            commentCount: 0,
            readBy: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          })
      );
    });

    it('投稿は1000文字以内でなければならない', async () => {
      const db = testEnv.authenticatedContext('user1').firestore();
      await assertFails(
        db.collection('families').doc('family1')
          .collection('boards').doc('board1')
          .collection('posts').add({
            content: 'a'.repeat(1001),
            imageUrls: [],
            authorId: 'user1',
            authorName: 'テストユーザー',
            isPinned: false,
            commentCount: 0,
            readBy: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          })
      );
    });
  });
});
```

### E2Eテスト

| シナリオ | テストファイル |
|---------|--------------|
| 新規登録→チュートリアル→ファミリー作成→投稿 | `newUserFlow.e2e.ts` |
| 招待コードでファミリー参加→投稿閲覧→コメント | `joinFamilyFlow.e2e.ts` |
| 設定変更→ログアウト→再ログイン | `settingsFlow.e2e.ts` |
| 投稿の編集→削除 | `postManagement.e2e.ts` |
| 退会処理 | `accountDeletion.e2e.ts` |

```typescript
// e2e/newUserFlow.e2e.ts
describe('新規ユーザーフロー', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('新規登録からファミリー作成まで完了する', async () => {
    // 新規登録
    await element(by.id('signup-link')).tap();
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('displayName-input')).typeText('テストユーザー');
    await element(by.id('signup-button')).tap();

    // チュートリアル
    await expect(element(by.id('tutorial-screen'))).toBeVisible();
    await element(by.id('skip-button')).tap();

    // ファミリー一覧
    await expect(element(by.id('family-list-screen'))).toBeVisible();
    await element(by.id('create-family-fab')).tap();

    // ファミリー作成
    await element(by.id('family-name-input')).typeText('テストファミリー');
    await element(by.id('create-button')).tap();

    // ファミリーホーム
    await expect(element(by.text('テストファミリー'))).toBeVisible();
  });
});
```

### モック方針

| 対象 | 単体テスト | 統合テスト | E2Eテスト |
|-----|----------|-----------|----------|
| Firebase Auth | Jest mock | Emulator | 実環境（テストアカウント） |
| Firestore | Jest mock | Emulator | Emulator |
| Storage | Jest mock | Emulator | Emulator |
| FCM | Jest mock | Mock | Mock |
| ネットワーク | MSW | MSW | 実ネットワーク |
| 画像ピッカー | Jest mock | Jest mock | 実デバイス |

```typescript
// __mocks__/firebase/auth.ts
export const signInWithEmailAndPassword = jest.fn().mockResolvedValue({
  user: { uid: 'test-uid', email: 'test@example.com' },
});

export const createUserWithEmailAndPassword = jest.fn().mockResolvedValue({
  user: { uid: 'test-uid', email: 'test@example.com' },
});

export const signOut = jest.fn().mockResolvedValue(undefined);

// __mocks__/expo-image-picker.ts
export const launchImageLibraryAsync = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [{ uri: 'file://mock-image.jpg' }],
});
```

---

## 9. 前提/未確定事項

### 確定した仕様

| 項目 | 決定内容 |
|-----|---------|
| ソーシャル認証 | 初期リリースはGoogle認証のみ（Instagram/Xは後のフェーズ） |
| 管理者設定 | 複数admin許可 |
| 検索範囲 | 投稿本文 + コメント |
| 通知設定 | ファミリー別に設定可能 |
| ファミリー所属上限 | 1ユーザーあたり最大10ファミリー |

### 仮定した点

1. **コメントのネスト**: 1階層まで（返信の返信は親コメントへの返信扱い）
2. **招待コード有効期限**: 7日間
3. **招待コード利用回数**: 1回のみ
4. **既読管理**: 投稿単位（コメントは既読管理対象外）
5. **ファミリー削除**: 全メンバー退会後に自動削除
6. **検索実装**: クライアントサイドフィルタ（Algolia未使用）
7. **画像リサイズ**: 長辺1920px、品質80%

### 追加確認が必要な点

1. **招待リンクドメイン**: Deep Linkのドメインとスキーム
2. **ブロック機能**: 特定メンバーをブロックする機能の必要性
3. **投稿編集履歴**: 編集履歴を残すかどうか
4. **管理者の最低人数**: 最後のadminが退会する際の挙動（自動でファミリー削除？）
5. **デフォルト掲示板**: ファミリー作成時にデフォルト掲示板を自動作成するか

---

## 実装順序（推奨）

```
Phase 1: 基盤構築 (1-2週目)
├── 1-1 〜 1-7: プロジェクト設定、共通コンポーネント

Phase 2: 認証機能 (3-4週目)
├── 2-1 〜 2-9: 認証画面、認証ロジック

Phase 3: ファミリー機能 (5-6週目)
├── 3-1 〜 3-10: ファミリーCRUD、招待機能

Phase 4: 掲示板機能 (7-9週目)
├── 4-1 〜 4-10: 掲示板、投稿、コメント

Phase 5: 画像添付 (10週目)
├── 5-1 〜 5-5: 画像アップロード、表示

Phase 6: 既読/ピン留め (11週目)
├── 6-1 〜 6-4: 既読管理、ピン留め

Phase 7: 検索機能 (12週目)
├── 7-1 〜 7-4: 検索画面、検索ロジック

Phase 8: 通知機能 (13-14週目)
├── 8-1 〜 8-8: FCM、Cloud Functions

Phase 9: 設定機能 (15週目)
├── 9-1 〜 9-6: 設定画面、退会処理

Phase 10: チュートリアル (16週目)
├── 10-1 〜 10-3: チュートリアル画面

Phase 11: 非機能要件対応 (17-18週目)
├── 11-1 〜 11-7: オフライン、アクセシビリティ

Phase 12: E2Eテスト・最終調整 (19-20週目)
├── E2Eテスト、バグ修正、パフォーマンスチューニング
```
