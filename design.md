# 設計書

## 1. 概要

### 対象プロダクト
家族の掲示板 - 家族で共有できる掲示板アプリ

### 目的 / ゴール
- 家族間のコミュニケーションを掲示板形式で促進する
- 子供から高齢者まで幅広い年齢層が使いやすいシンプルなUIを提供する
- 複数のファミリーへの所属に対応し、柔軟な家族構成をサポートする

### スコープ

**対象**
- iOS / Android モバイルアプリ
- 認証（メール、Google、Instagram、X）
- ファミリー管理（作成、編集、招待、退会）
- 掲示板機能（投稿、コメント、画像添付、ピン留め、既読管理）
- プッシュ通知

**対象外**
- Webアプリ（初期リリース対象外）
- ビデオ通話 / リアルタイムチャット
- カレンダー / スケジュール管理

---

## 2. 前提・参照

### 要件定義書
- [family.md](family.md)

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React Native + Expo |
| 認証 | Firebase Authentication |
| データベース | Cloud Firestore |
| ストレージ | Cloud Storage for Firebase |
| プッシュ通知 | Firebase Cloud Messaging (FCM) |
| クラッシュレポート | Firebase Crashlytics |
| 分析 | Firebase Analytics |

### 非機能要件
- iOS 14.0以上 / Android 10 (API 29)以上
- アプリ起動3秒以内、画面遷移1秒以内
- サービス稼働率99.5%以上
- オフライン時は閲覧のみ（キャッシュ）

---

## 3. アーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native + Expo)          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   認証    │  │ ファミリー │  │  掲示板   │  │   通知    │    │
│  │  画面群   │  │  画面群   │  │  画面群   │  │  設定    │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│  ┌────┴─────────────┴─────────────┴─────────────┴────┐      │
│  │              状態管理 (Context / Zustand)          │      │
│  └────┬─────────────┬─────────────┬─────────────┬────┘      │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌───────────────────────────────────────────────────────────┐
│                     Firebase Services                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │ Firestore │  │  Storage │  │   FCM    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────────────────────────────────────────┘
```

### 認証フロー概要

```
1. 新規登録 / ログイン
   ┌──────┐    ┌──────────────┐    ┌────────────┐
   │ ユーザー │ →→ │ Firebase Auth │ →→ │ ユーザー作成  │
   └──────┘    └──────────────┘    │ (Firestore) │
                                    └────────────┘

2. ソーシャルログイン（Google/Instagram/X）
   ┌──────┐    ┌───────────┐    ┌──────────────┐
   │ ユーザー │ →→ │ OAuth認証  │ →→ │ Firebase Auth │
   └──────┘    └───────────┘    └──────────────┘
```

### データフロー概要

```
投稿作成フロー:
┌──────┐   ┌────────┐   ┌──────────┐   ┌──────────┐
│ 投稿入力 │ → │ 画像選択 │ → │ Storage  │ → │ Firestore │
└──────┘   │ (任意)  │   │ アップロード│   │  保存     │
           └────────┘   └──────────┘   └──────────┘
                                              │
                                              ▼
                                       ┌──────────┐
                                       │ FCM通知  │
                                       │ 送信     │
                                       └──────────┘
```

### 通知フロー概要

```
┌────────────┐   ┌──────────────────┐   ┌───────────┐
│ Firestore   │ → │ Cloud Functions  │ → │ FCM       │
│ トリガー     │   │ (通知判定/送信)   │   │ プッシュ送信│
└────────────┘   └──────────────────┘   └───────────┘
```

---

## 4. データモデル（Firestore）

### コレクション一覧

```
/users/{userId}
/families/{familyId}
/families/{familyId}/boards/{boardId}
/families/{familyId}/boards/{boardId}/posts/{postId}
/families/{familyId}/boards/{boardId}/posts/{postId}/comments/{commentId}
/families/{familyId}/members/{memberId}
/families/{familyId}/invitations/{invitationId}
```

### 主要フィールド

#### users
```typescript
interface User {
  id: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  profileImageUrl?: string;
  familyIds: string[];           // 所属ファミリーID配列
  fcmTokens: string[];           // 通知用トークン
  notificationSettings: {
    newPost: boolean;
    newComment: boolean;
    familyInvite: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;         // 論理削除用
}
```

#### families
```typescript
interface Family {
  id: string;
  name: string;
  iconUrl?: string;
  ownerId: string;               // 作成者（管理者）
  memberCount: number;           // 非正規化
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### families/{familyId}/members
```typescript
interface FamilyMember {
  id: string;                    // = userId
  userId: string;
  displayName: string;           // ファミリー内での表示名
  relationship: string;          // 続柄（お父さん、お母さん等）
  role: 'admin' | 'child';       // 権限
  joinedAt: Timestamp;
}
```

#### families/{familyId}/boards
```typescript
interface Board {
  id: string;
  name: string;
  description?: string;
  createdBy: string;             // userId
  postCount: number;             // 非正規化
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### families/{familyId}/boards/{boardId}/posts
```typescript
interface Post {
  id: string;
  content: string;               // 最大1000文字
  imageUrls: string[];           // 最大3枚
  authorId: string;              // userId
  authorName: string;            // 非正規化
  isPinned: boolean;
  commentCount: number;          // 非正規化
  readBy: string[];              // 既読ユーザーID配列
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### families/{familyId}/boards/{boardId}/posts/{postId}/comments
```typescript
interface Comment {
  id: string;
  content: string;
  imageUrl?: string;             // 1枚まで
  authorId: string;
  authorName: string;            // 非正規化
  parentCommentId?: string;      // 返信の場合
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### families/{familyId}/invitations
```typescript
interface Invitation {
  id: string;
  code: string;                  // 6桁英数字
  createdBy: string;
  expiresAt: Timestamp;          // 有効期限（7日間）
  usedBy?: string;
  usedAt?: Timestamp;
  createdAt: Timestamp;
}
```

### リレーション/参照

```
User ←──────────────── FamilyMember (userId)
  │
  └── familyIds[] ───→ Family
                         │
                         ├── members/ ───→ FamilyMember
                         ├── boards/ ────→ Board
                         │                   │
                         │                   └── posts/ ──→ Post
                         │                                   │
                         │                                   └── comments/ → Comment
                         └── invitations/ → Invitation
```

### インデックス

| コレクション | フィールド | 種別 |
|------------|-----------|------|
| posts | familyId, createdAt DESC | 複合 |
| posts | familyId, isPinned, createdAt DESC | 複合 |
| posts | authorId, createdAt DESC | 複合 |
| comments | postId, createdAt ASC | 複合 |
| invitations | code, expiresAt | 複合 |

### データ保持/削除ポリシー

| データ種別 | 保持期間 | 削除契機 |
|-----------|---------|---------|
| ユーザーデータ | 退会後30日 | バッチ処理で削除 |
| 投稿/コメント | 退会と同時に削除 | ユーザー退会時 |
| 画像 | 投稿削除と同時 | Storage連携削除 |
| 招待コード | 使用済み or 期限切れ後7日 | バッチ処理で削除 |

---

## 5. 権限・セキュリティ

### 役割と権限

| 操作 | 管理者(admin) | 子供(child) |
|-----|:------------:|:-----------:|
| ファミリー編集 | ✓ | - |
| ファミリー削除 | ✓ | - |
| メンバー招待 | ✓ | - |
| メンバー削除 | ✓ | - |
| 掲示板作成 | ✓ | - |
| 掲示板編集/削除 | ✓ | - |
| 投稿作成 | ✓ | ✓ |
| 自分の投稿編集/削除 | ✓ | ✓ |
| 他人の投稿削除 | ✓ | - |
| 投稿ピン留め | ✓ | - |
| コメント作成 | ✓ | ✓ |
| 自分のコメント削除 | ✓ | ✓ |
| 通知設定変更 | ✓ | ✓ |
| 自分のファミリー退会 | ✓ | ✓ |

### Security Rules 方針

```javascript
// 基本方針
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ユーザー: 本人のみ読み書き
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ファミリー: メンバーのみ読み取り、adminのみ書き込み
    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow update, delete: if isFamilyAdmin(familyId);
      allow create: if request.auth != null;

      // メンバー
      match /members/{memberId} {
        allow read: if isFamilyMember(familyId);
        allow write: if isFamilyAdmin(familyId);
      }

      // 掲示板
      match /boards/{boardId} {
        allow read: if isFamilyMember(familyId);
        allow write: if isFamilyAdmin(familyId);

        // 投稿
        match /posts/{postId} {
          allow read: if isFamilyMember(familyId);
          allow create: if isFamilyMember(familyId);
          allow update: if isPostAuthor(postId) || isFamilyAdmin(familyId);
          allow delete: if isPostAuthor(postId) || isFamilyAdmin(familyId);

          // コメント
          match /comments/{commentId} {
            allow read: if isFamilyMember(familyId);
            allow create: if isFamilyMember(familyId);
            allow delete: if isCommentAuthor(commentId) || isFamilyAdmin(familyId);
          }
        }
      }

      // 招待
      match /invitations/{invitationId} {
        allow read: if isFamilyAdmin(familyId);
        allow create: if isFamilyAdmin(familyId);
      }
    }
  }
}
```

### 招待コード/招待リンクの扱い

1. **生成**: 管理者のみが招待コードを生成可能
2. **形式**: 6桁英数字（大文字）、例: `ABC123`
3. **有効期限**: 生成から7日間
4. **利用回数**: 1回のみ（使用後は無効化）
5. **招待リンク**: `https://app.example.com/invite/{code}` 形式でディープリンク対応
6. **検証フロー**:
   - コード入力 → Firestore検索 → 有効性確認 → ファミリー参加 → コード無効化

### 退会時のデータ処理

1. **ファミリー退会時**
   - 該当ファミリー内の投稿・コメントを即時削除
   - FamilyMemberドキュメントを削除
   - User.familyIdsから該当IDを削除

2. **アカウント退会時**
   - 全ファミリーから退会処理を実行
   - Userドキュメントに`deletedAt`を設定（論理削除）
   - 30日後にバッチ処理で物理削除（Firebase Auth含む）
   - Storage内の画像も削除

---

## 6. 画面設計

### 画面一覧

| カテゴリ | 画面名 | 説明 |
|---------|-------|------|
| 認証 | スプラッシュ | アプリ起動時のロード画面 |
| 認証 | ログイン | メール/ソーシャルログイン |
| 認証 | 新規登録 | アカウント作成 |
| 認証 | パスワードリセット | パスワード再設定 |
| 認証 | チュートリアル | 初回起動時の説明画面 |
| ホーム | ファミリー一覧 | 所属ファミリーの一覧 |
| ホーム | ファミリー作成 | 新規ファミリー作成 |
| ホーム | ファミリー参加 | 招待コード入力 |
| ファミリー | ファミリーホーム | 掲示板一覧 |
| ファミリー | ファミリー設定 | 名前変更、メンバー管理 |
| ファミリー | メンバー一覧 | ファミリーメンバー確認 |
| ファミリー | 招待画面 | 招待コード生成/共有 |
| 掲示板 | 掲示板詳細 | 投稿一覧 |
| 掲示板 | 投稿詳細 | 投稿本文とコメント |
| 掲示板 | 投稿作成/編集 | 投稿入力画面 |
| 掲示板 | 掲示板検索 | 投稿検索 |
| 設定 | 設定トップ | 各種設定メニュー |
| 設定 | プロフィール編集 | 名前、アイコン変更 |
| 設定 | 通知設定 | 通知ON/OFF |
| 設定 | アカウント | 退会、ログアウト |

### 画面遷移

```
[スプラッシュ]
     │
     ├─── 未認証 ───→ [ログイン] ←──→ [新規登録]
     │                    │              │
     │                    └──→ [パスワードリセット]
     │
     └─── 認証済 ───→ [チュートリアル]（初回のみ）
                           │
                           ▼
                    [ファミリー一覧]
                      │   │   │
        ┌─────────────┘   │   └─────────────┐
        ▼                 ▼                 ▼
  [ファミリー作成]  [ファミリー参加]  [ファミリーホーム]
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
             [ファミリー設定]      [掲示板詳細]           [設定トップ]
                    │                    │                    │
             ┌──────┴──────┐      ┌──────┴──────┐      ┌──────┴──────┐
             ▼             ▼      ▼             ▼      ▼             ▼
       [メンバー一覧] [招待画面] [投稿詳細] [投稿作成] [プロフィール] [通知設定]
```

### 主要ユーザーフロー

#### 投稿作成フロー
1. 掲示板詳細画面で「+」ボタンタップ
2. 投稿作成画面で本文入力
3. （任意）画像添付ボタンで写真選択（最大3枚）
4. 「投稿」ボタンで送信
5. 掲示板詳細に戻り、新規投稿が表示される

#### ファミリー招待フロー
1. ファミリー設定 → 招待画面
2. 「招待コードを作成」タップ
3. 6桁コードが生成される
4. 「共有」でLINE/メール等に送信、または「コピー」
5. 招待された人はアプリで「ファミリーに参加」→ コード入力

#### 退会フロー
1. 設定 → アカウント → 退会
2. 確認ダイアログ表示（「投稿は全て削除されます」）
3. 再認証（パスワード入力）
4. 退会処理実行 → ログイン画面へ

### 状態管理の粒度

| スコープ | 管理方法 | 対象データ |
|---------|---------|-----------|
| グローバル | Context | 認証状態、現在のユーザー情報 |
| グローバル | Zustand | 現在選択中のファミリー、未読数 |
| 画面ローカル | useState | フォーム入力、モーダル開閉 |
| サーバー同期 | React Query / useSWR | ファミリー一覧、投稿一覧、コメント |

---

## 7. 機能設計

### 認証

| 機能 | 詳細 |
|-----|------|
| メール認証 | Firebase Auth `createUserWithEmailAndPassword` / `signInWithEmailAndPassword` |
| Google | `signInWithPopup` + `GoogleAuthProvider` |
| Instagram | OAuth2.0 → カスタムトークン認証 |
| X (Twitter) | OAuth2.0 → カスタムトークン認証 |
| パスワードリセット | `sendPasswordResetEmail` |
| セッション管理 | 30日間有効、`signOut`で明示的ログアウト |

### ファミリー

| 機能 | 詳細 |
|-----|------|
| 作成 | familiesコレクションにドキュメント作成、作成者をadminとしてmembersに追加 |
| 編集 | 名前、アイコン変更（adminのみ） |
| 削除 | 全メンバー退会後のみ可能、または全データ削除確認の上実行 |
| 招待 | 招待コード生成 → 共有 → コード入力でmembersに追加 |
| 退会 | membersから削除、該当ファミリー内の投稿削除 |

### ファミリーメンバー

| 機能 | 詳細 |
|-----|------|
| 登録 | 招待コードで参加時に自動登録、続柄は参加後に設定 |
| 削除 | adminがメンバーを強制退会（本人の退会とは別） |
| 権限変更 | adminが他メンバーをadminに昇格/降格 |

### 掲示板/投稿/コメント

| 機能 | 詳細 |
|-----|------|
| 掲示板作成 | adminがboards配下にドキュメント作成 |
| 投稿作成 | 本文（1000字以内）+ 画像（3枚以内、各5MB以内） |
| 投稿編集 | 本人またはadminのみ |
| 投稿削除 | 本人またはadminのみ、画像もStorage削除 |
| コメント | 投稿に対する返信、ネスト1階層まで（返信の返信は不可） |
| 検索 | 投稿本文の全文検索（Firestoreの制約上、クライアントサイドフィルタまたはAlgolia連携） |

### 画像添付

| 項目 | 仕様 |
|-----|------|
| 保存先 | Cloud Storage: `families/{familyId}/posts/{postId}/{imageId}` |
| サイズ制限 | 1枚5MB以下 |
| 枚数制限 | 投稿: 3枚、コメント: 1枚 |
| リサイズ | アップロード前にクライアントで1920px以下にリサイズ |
| 形式 | JPEG, PNG, HEIC対応（HEICはJPEG変換） |

### 既読/ピン留め

| 機能 | 詳細 |
|-----|------|
| 既読 | 投稿詳細画面表示時に`readBy`配列にuserIdを追加 |
| 未読表示 | 掲示板一覧で未読投稿数をバッジ表示 |
| ピン留め | adminが`isPinned: true`に設定、一覧上部に固定表示 |

### 通知

| 通知種別 | 条件 | 内容 |
|---------|------|------|
| 新規投稿 | 所属ファミリーに投稿あり | 「{名前}さんが{掲示板名}に投稿しました」 |
| 新規コメント | 自分の投稿にコメントあり | 「{名前}さんがコメントしました」 |
| ファミリー招待 | 招待コードで参加された | 「{名前}さんがファミリーに参加しました」 |

**通知送信フロー**
1. Firestoreトリガー（onCreate）
2. Cloud Functionsで通知対象者を特定
3. 通知設定を確認（OFFなら送信しない）
4. FCMでプッシュ送信

### チュートリアル

| 画面 | 内容 |
|-----|------|
| 1 | アプリの概要説明 |
| 2 | ファミリーの作り方/参加の仕方 |
| 3 | 投稿の方法 |
| 4 | 通知の設定 |

- 初回起動時のみ表示
- 「スキップ」ボタンで飛ばし可能
- 設定画面から再度閲覧可能

---

## 8. 非機能要件への対応

### パフォーマンス

| 要件 | 対応方針 |
|-----|---------|
| 起動3秒以内 | スプラッシュ画面表示、認証状態のキャッシュ |
| 画面遷移1秒以内 | 遷移先データのプリフェッチ、React Navigation最適化 |
| 掲示板読み込み2秒以内 | ページネーション（20件ずつ）、インデックス最適化 |
| 画像アップロード10秒以内 | クライアントリサイズ、resumable upload |

### 可用性/オフライン

| 項目 | 対応方針 |
|-----|---------|
| オフライン閲覧 | Firestore永続化キャッシュ有効化 |
| オフライン投稿 | 不可（オンライン時のみ）、オフライン時はUI無効化 |
| 再接続時 | 自動同期（Firestoreのリアルタイムリスナー） |
| エラーリトライ | Exponential backoffで3回リトライ |

### セキュリティ

| 項目 | 対応方針 |
|-----|---------|
| 通信暗号化 | Firebase SDKはデフォルトHTTPS |
| 認証トークン | Firebase Auth IDトークン自動管理 |
| データアクセス | Security Rulesで厳密に制御 |
| 画像アクセス | Storage Security Rulesでファミリーメンバーのみ |
| 入力検証 | クライアント + Security Rules両方で検証 |

### アクセシビリティ

| 項目 | 対応方針 |
|-----|---------|
| フォントサイズ | Expo Font Scaling対応 |
| タップ領域 | 最小44x44pt確保 |
| コントラスト | WCAG AA準拠（4.5:1以上） |
| スクリーンリーダー | accessibilityLabel設定 |
| エラーメッセージ | 平易な日本語で具体的に表示 |

### ログ/分析

| 項目 | 対応方針 |
|-----|---------|
| クラッシュログ | Firebase Crashlytics |
| 利用状況分析 | Firebase Analytics（画面遷移、ボタンタップ） |
| エラー監視 | カスタムイベントでエラー送信 |
| 強制アップデート | Remote Configでバージョンチェック |

---

## 9. テスト戦略（TDD）

### テストフレームワーク構成

| 種別 | ツール | 用途 |
|-----|-------|------|
| ユニットテスト・統合テスト | Jest | React Nativeの標準テストフレームワーク、Firebase連携テスト、ビジネスロジック・ユーティリティ関数のテスト |
| コンポーネントテスト | React Testing Library (@testing-library/react-native) | Jestと組み合わせて使用、UIコンポーネントの挙動検証、ユーザーインタラクションのテスト |
| E2Eテスト | Detox | 実機/シミュレータでの実際のユーザーフロー検証、クリティカルなビジネスフロー（認証、データ送受信等）のテスト |
| クロスデバイステスト | BrowserStack | クラウド上の実デバイスでのE2Eテスト、多様なデバイス・OSバージョンでの互換性テスト |
| Firebase テスト環境 | Firebase Emulator Suite | ローカル開発環境でのFirestore、Authentication、Storage のテスト、CI/CDパイプラインでの外部依存排除 |

### 単体テスト

| 対象 | ツール | カバレッジ目標 |
|-----|-------|--------------|
| ユーティリティ関数 | Jest | 90%以上 |
| カスタムフック | Jest + React Testing Library | 80%以上 |
| 状態管理 (Zustand) | Jest | 80%以上 |
| バリデーション (Zod) | Jest | 100% |
| Firebaseサービス層 | Jest + モック | 80%以上 |

**テスト例**
```typescript
// バリデーションのテスト例
describe('validateInvitationCode', () => {
  it('6桁英数字を有効と判定する', () => {
    expect(validateInvitationCode('ABC123')).toBe(true);
  });

  it('5桁以下を無効と判定する', () => {
    expect(validateInvitationCode('ABC12')).toBe(false);
  });
});
```

### コンポーネントテスト

| 対象 | ツール | テスト観点 |
|-----|-------|----------|
| UIコンポーネント (Button, Input等) | React Testing Library | レンダリング、props変更時の挙動 |
| フォームコンポーネント | React Testing Library + react-hook-form | 入力検証、送信処理 |
| リスト表示コンポーネント | React Testing Library | データ表示、空状態、ローディング状態 |

**テスト例**
```typescript
// コンポーネントテストの例
describe('Button', () => {
  it('タップ時にonPressが呼ばれる', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="送信" onPress={onPress} />);
    fireEvent.press(getByText('送信'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('disabled時はonPressが呼ばれない', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="送信" onPress={onPress} disabled />);
    fireEvent.press(getByText('送信'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### 統合テスト (Firebase Emulator Suite)

| 対象 | ツール |
|-----|-------|
| Firebase Auth連携 | Firebase Emulator Suite (Auth) |
| Firestore CRUD | Firebase Emulator Suite (Firestore) |
| Security Rules | @firebase/rules-unit-testing |
| Storage操作 | Firebase Emulator Suite (Storage) |

**Emulator設定**
```
# firebase.json
{
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true, "port": 4000 }
  }
}
```

**テスト例**
- ユーザー作成 → ファミリー作成 → 投稿作成の一連の流れ
- 権限がない操作が拒否されることの確認
- Security Rulesが正しく適用されているか

### E2Eテスト (Detox)

| 対象 | ツール | 実行環境 |
|-----|-------|---------|
| ユーザーフロー | Detox | iOS Simulator / Android Emulator |
| 画面遷移 | Detox | 両プラットフォームで実行 |
| クリティカルパス | Detox | CI/CDで自動実行 |

**テストシナリオ（クリティカルパス）**
1. 新規登録 → チュートリアル → ファミリー作成 → 投稿
2. 招待コードでファミリー参加 → 投稿閲覧 → コメント
3. 設定変更 → ログアウト → 再ログイン
4. 画像添付付き投稿 → 削除

**Detox設定例**
```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 }
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/FamilyBulletinBoard.app',
      build: 'xcodebuild -workspace ios/FamilyBulletinBoard.xcworkspace ...'
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug'
    }
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 15' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_7_API_34' } }
  },
  configurations: {
    'ios.sim.debug': { device: 'simulator', app: 'ios.debug' },
    'android.emu.debug': { device: 'emulator', app: 'android.debug' }
  }
};
```

### クロスデバイステスト (BrowserStack)

| 用途 | サービス | 説明 |
|-----|---------|------|
| 実機テスト | BrowserStack App Automate | クラウド上の実デバイスでE2Eテストを実行 |
| 手動テスト | BrowserStack App Live | 実デバイスでの手動確認・探索的テスト |
| スクリーンショット比較 | BrowserStack Percy | ビジュアルリグレッションテスト |

**BrowserStackを使用する理由**
- 実機での動作確認（シミュレータでは再現できない問題の検出）
- 多様なデバイス・OSバージョンでのテスト（iOS 14〜最新、Android 10〜最新）
- CI/CDパイプラインへの統合
- デバイス購入・管理コストの削減

**テスト対象デバイス**

| プラットフォーム | デバイス例 | OSバージョン |
|---------------|----------|-------------|
| iOS | iPhone SE, iPhone 13, iPhone 15 Pro | iOS 14, 16, 17 |
| iOS | iPad (9th gen), iPad Pro | iPadOS 15, 17 |
| Android | Pixel 7, Samsung Galaxy S23 | Android 12, 13, 14 |
| Android | Samsung Galaxy Tab S8 | Android 13 |

**BrowserStack連携設定例**
```yaml
# .github/workflows/e2e-browserstack.yml
name: E2E Tests on BrowserStack

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-browserstack:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build Android APK
        run: eas build --platform android --profile preview --local

      - name: Upload to BrowserStack
        run: |
          curl -u "${{ secrets.BROWSERSTACK_USERNAME }}:${{ secrets.BROWSERSTACK_ACCESS_KEY }}" \
            -X POST "https://api-cloud.browserstack.com/app-automate/upload" \
            -F "file=@app-release.apk"

      - name: Run E2E Tests
        env:
          BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
          BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
        run: npm run test:e2e:browserstack
```

**BrowserStack Detox連携設定**
```javascript
// detox.config.js (BrowserStack用)
module.exports = {
  configurations: {
    'android.browserstack': {
      device: {
        type: 'android.cloud',
        provider: 'browserstack',
        device: { name: 'Google Pixel 7', os_version: '13.0' }
      },
      app: 'android.release'
    },
    'ios.browserstack': {
      device: {
        type: 'ios.cloud',
        provider: 'browserstack',
        device: { name: 'iPhone 15 Pro', os_version: '17' }
      },
      app: 'ios.release'
    }
  }
};
```

**実行タイミング**
- PRマージ前: 主要デバイス（iPhone 15, Pixel 7）でスモークテスト
- リリース前: 全対象デバイスでフルリグレッションテスト
- 週次: 定期的な互換性確認テスト

### モック/スタブ方針

| 対象 | 単体テスト | 統合テスト | E2Eテスト |
|-----|----------|----------|----------|
| Firebase Auth | jest.mock | Emulator | 実際のEmulator |
| Firestore | jest.mock | Emulator | 実際のEmulator |
| Storage | jest.mock (ファイルアップロード偽装) | Emulator | 実際のEmulator |
| FCM | jest.mock | jest.mock | モック（実際の通知は送信しない） |
| 外部OAuth | jest.mock (トークン返却偽装) | jest.mock | スキップまたはモック |

### テストカバレッジ目標

| カテゴリ | 目標値 |
|---------|-------|
| 全体 | 70%以上 |
| ユーティリティ関数 | 90%以上 |
| バリデーション | 100% |
| カスタムフック | 80%以上 |
| コンポーネント | 70%以上 |
| サービス層 | 80%以上 |

### 実装時の要件

1. 各コンポーネント・関数に対してユニットテストを実装する
2. Firebase操作が含まれるコードはEmulatorでテストする
3. ユーザーフローに関わるコンポーネントはReact Testing Libraryでテストする
4. クリティカルパスはDetoxでE2Eテストする
5. テストカバレッジは全体で70%以上を維持する
6. PRマージ前にCI/CDでテストが全てパスすることを確認する

---

## 10. 前提/未確定事項

### 仮定した点

1. **ファミリー削除**: 全メンバー退会後のみ削除可能とした（最後のadminが退会すると自動削除）
2. **コメントのネスト**: 1階層までとした（返信の返信は親コメントへの返信扱い）
3. **招待コード有効期限**: 7日間とした
4. **既読管理**: 投稿単位とした（コメントは既読管理対象外）
5. **Instagram/X認証**: OAuth→カスタムトークン方式とした（Firebase Auth直接サポート外のため）
6. **検索機能**: クライアントサイドフィルタとした（Algolia未使用の場合）

### 未確定事項（追加確認が必要）

1. **Instagram/X認証**: これらのソーシャルログインは実装コストが高い。優先度を確認したい
2. **検索機能の範囲**: 投稿本文のみか、コメントも含むか
3. **ファミリーの上限**: 1ユーザーが所属できるファミリー数に上限を設けるか
4. **管理者の複数指定**: 1ファミリーに複数adminを許可するか
5. **画像の圧縮品質**: クライアントリサイズ時の品質設定
6. **通知の細かい設定**: ファミリーごとに通知ON/OFFを設定できるようにするか
7. **ブロック機能**: 特定メンバーをブロックする機能は必要か
8. **投稿の編集履歴**: 編集履歴を残すか
9. **Deep Link**: 招待リンクのドメインとスキーム
