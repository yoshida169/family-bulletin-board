# 家族の掲示板 - 今後の実装フェーズ

## ✅ 完了済み: Phase 1 - ファミリー機能（基盤）

全タスク完了・テスト通過・GitHubにpush済み

---

## 📋 未実装フェーズ概要

### Phase 2: 掲示板機能（投稿CRUD）
**並行実行可能度**: ⭐⭐⭐ (Phase 1完了後に単独実行可)  
**推定作業時間**: 4-6時間  
**並行エージェント数**: 1-2個

### Phase 3: コメント・既読機能
**並行実行可能度**: ⭐⭐ (Phase 2完了後)  
**推定作業時間**: 3-4時間  
**並行エージェント数**: 1-2個

### Phase 4: 検索・フィルタリング機能
**並行実行可能度**: ⭐⭐⭐ (Phase 2完了後に並行可)  
**推定作業時間**: 2-3時間  
**並行エージェント数**: 1個

### Phase 5: 通知機能
**並行実行可能度**: ⭐⭐⭐ (Phase 2完了後に並行可)  
**推定作業時間**: 3-4時間  
**並行エージェント数**: 1個

### Phase 6: ソーシャルログイン
**並行実行可能度**: ⭐⭐⭐⭐⭐ (Phase 1完了後に独立実行可)  
**推定作業時間**: 2-3時間  
**並行エージェント数**: 1個

### Phase 7: 設定・プロフィール機能
**並行実行可能度**: ⭐⭐⭐⭐ (Phase 1完了後に並行可)  
**推定作業時間**: 3-4時間  
**並行エージェント数**: 1個

### Phase 8: チュートリアル機能
**並行実行可能度**: ⭐ (全機能完了後)  
**推定作業時間**: 2-3時間  
**並行エージェント数**: 1個

### Phase 9: 最適化・仕上げ
**並行実行可能度**: ⭐ (全機能完了後)  
**推定作業時間**: 4-6時間  
**並行エージェント数**: 2-3個（レビュー、パフォーマンス、E2E並行可）

---

## 🚀 Phase 2: 掲示板機能（投稿CRUD）

### 概要
ファミリー内での投稿作成・表示・編集・削除機能

### 前提条件
- ✅ Phase 1完了（ファミリー機能）

### 実装ファイル

#### 1. サービス層（TDD）
- [x] `src/services/firebase/post.ts` - 既に作成済み
- [ ] `src/services/firebase/storage.ts` - 画像アップロード

**タスク**:
```bash
# Agent 1: Storage Service (TDD)
1. __tests__/services/storageService.test.ts 作成
2. src/services/firebase/storage.ts 実装
   - uploadImage(file, path): Promise<string>
   - deleteImage(url): Promise<void>
   - getImageUrl(path): Promise<string>
```

#### 2. 状態管理・フック
- [ ] `src/hooks/usePosts.ts`
- [ ] `src/hooks/usePost.ts`
- [ ] `src/hooks/useImagePicker.ts`

**タスク**:
```bash
# Agent 1: Post Hooks
1. src/hooks/usePosts.ts 実装
   - 投稿一覧取得
   - リアルタイム購読
   - ページネーション
2. src/hooks/usePost.ts 実装
   - 単一投稿取得
   - 投稿作成・更新・削除
3. src/hooks/useImagePicker.ts 実装
   - expo-image-picker統合
   - 画像選択・プレビュー
```

#### 3. UIコンポーネント（TDD）
- [ ] `src/components/post/PostCard.tsx`
- [ ] `src/components/post/PostList.tsx`
- [ ] `src/components/post/PostForm.tsx`
- [ ] `src/components/post/ImageAttachment.tsx`
- [ ] `src/components/post/PinnedBadge.tsx`

**タスク**:
```bash
# Agent 2: Post Components (並行可)
1. __tests__/components/post/*.test.tsx 作成（5ファイル）
2. src/components/post/*.tsx 実装（5ファイル）
   - PostCard: 投稿カード表示
   - PostList: 投稿一覧（無限スクロール）
   - PostForm: 投稿作成・編集フォーム
   - ImageAttachment: 画像添付プレビュー
   - PinnedBadge: ピン留めバッジ
```

#### 4. 画面
- [ ] `app/(main)/post/[id]/index.tsx` - 投稿詳細
- [ ] `app/(main)/post/[id]/edit.tsx` - 投稿編集
- [x] `app/(main)/post/create.tsx` - 既に作成済み（更新必要）

**タスク**:
```bash
# Agent 1 or 2: Post Screens
1. app/(main)/post/[id]/index.tsx 作成
   - 投稿詳細表示
   - 画像表示
   - ピン留めトグル
   - 編集・削除ボタン
2. app/(main)/post/[id]/edit.tsx 作成
   - 投稿編集フォーム
   - 画像追加・削除
3. app/(main)/post/create.tsx 更新
   - PostFormコンポーネント統合
   - 画像添付機能追加
```

#### 5. ホームタブ更新
- [ ] `app/(main)/(tabs)/index.tsx` 更新

**タスク**:
```bash
# Agent 1: Home Tab Update
1. app/(main)/(tabs)/index.tsx 更新
   - PostListコンポーネント統合
   - リアルタイム購読
   - Pull-to-refresh
   - 無限スクロール
```

### テスト実行
```bash
npm test -- __tests__/services/storageService.test.ts
npm test -- __tests__/components/post/
```

### コミット戦略
1. Storage service (TDD)
2. Post hooks
3. Post components (TDD)
4. Post screens
5. Home tab update

---

## 🚀 Phase 3: コメント・既読機能

### 概要
投稿へのコメント/返信機能と既読管理

### 前提条件
- ✅ Phase 1完了
- ✅ Phase 2完了

### 実装ファイル

#### 1. サービス層（TDD）
- [ ] `src/services/firebase/comment.ts`
- [ ] `src/services/firebase/readRecord.ts`

**タスク**:
```bash
# Agent 1: Comment & Read Services (TDD)
1. __tests__/services/commentService.test.ts 作成
2. src/services/firebase/comment.ts 実装
   - createComment
   - deleteComment
   - updateComment
   - getPostComments
3. __tests__/services/readRecordService.test.ts 作成
4. src/services/firebase/readRecord.ts 実装
   - markAsRead
   - getReadStatus
   - getUnreadCount
```

#### 2. フック
- [ ] `src/hooks/useComments.ts`
- [ ] `src/hooks/useReadStatus.ts`

**タスク**:
```bash
# Agent 1: Comment Hooks
1. src/hooks/useComments.ts 実装
2. src/hooks/useReadStatus.ts 実装
```

#### 3. UIコンポーネント（TDD）
- [ ] `src/components/post/CommentCard.tsx`
- [ ] `src/components/post/CommentList.tsx`
- [ ] `src/components/post/CommentInput.tsx`
- [ ] `src/components/post/ReadStatus.tsx`

**タスク**:
```bash
# Agent 2: Comment Components (並行可)
1. __tests__/components/post/Comment*.test.tsx 作成（4ファイル）
2. src/components/post/Comment*.tsx 実装（4ファイル）
```

#### 4. 画面更新
- [ ] `app/(main)/post/[id]/index.tsx` にコメント機能追加

**タスク**:
```bash
# Agent 1: Post Detail Update
1. app/(main)/post/[id]/index.tsx 更新
   - CommentList追加
   - CommentInput追加
   - ReadStatus表示
```

### コミット戦略
1. Comment & read services (TDD)
2. Comment hooks
3. Comment components (TDD)
4. Post detail screen update

---

## 🚀 Phase 4: 検索・フィルタリング機能

### 概要
投稿の検索とフィルタリング

### 前提条件
- ✅ Phase 1完了
- ✅ Phase 2完了

### 実装ファイル

#### 1. フック
- [ ] `src/hooks/useSearch.ts`

**タスク**:
```bash
# Agent 1: Search Hook
1. src/hooks/useSearch.ts 実装
   - デバウンス処理
   - 全文検索
   - フィルタリング（作成者、日付、ピン留め）
```

#### 2. UIコンポーネント（TDD）
- [ ] `src/components/common/SearchBar.tsx`
- [ ] `src/components/common/FilterChips.tsx`

**タスク**:
```bash
# Agent 1: Search Components (TDD)
1. __tests__/components/common/SearchBar.test.tsx 作成
2. src/components/common/SearchBar.tsx 実装
3. __tests__/components/common/FilterChips.test.tsx 作成
4. src/components/common/FilterChips.tsx 実装
```

#### 3. 画面
- [ ] `app/(main)/search.tsx`

**タスク**:
```bash
# Agent 1: Search Screen
1. app/(main)/search.tsx 作成
   - SearchBar統合
   - FilterChips統合
   - 検索結果表示
```

### コミット戦略
1. Search hook with debounce
2. Search components (TDD)
3. Search screen

---

## 🚀 Phase 5: 通知機能

### 概要
プッシュ通知とアプリ内通知

### 前提条件
- ✅ Phase 1完了
- ✅ Phase 2完了

### 実装ファイル

#### 1. サービス層（TDD）
- [ ] `src/services/firebase/notification.ts`
- [ ] `src/services/firebase/fcm.ts`

**タスク**:
```bash
# Agent 1: Notification Services (TDD)
1. __tests__/services/notificationService.test.ts 作成
2. src/services/firebase/notification.ts 実装
   - createNotification
   - markAsRead
   - getUserNotifications
3. __tests__/services/fcmService.test.ts 作成
4. src/services/firebase/fcm.ts 実装
   - registerToken
   - sendNotification
   - subscribeTopic
```

#### 2. 状態管理・フック
- [ ] `src/store/notificationStore.ts`
- [ ] `src/hooks/useNotifications.ts`
- [ ] `src/hooks/usePushNotification.ts`

**タスク**:
```bash
# Agent 1: Notification Store & Hooks
1. __tests__/store/notificationStore.test.ts 作成
2. src/store/notificationStore.ts 実装
3. src/hooks/useNotifications.ts 実装
4. src/hooks/usePushNotification.ts 実装
```

#### 3. UIコンポーネント（TDD）
- [ ] `src/components/notification/NotificationCard.tsx`
- [ ] `src/components/notification/NotificationList.tsx`

**タスク**:
```bash
# Agent 2: Notification Components (並行可)
1. __tests__/components/notification/*.test.tsx 作成
2. src/components/notification/*.tsx 実装
```

#### 4. 通知タブ更新
- [ ] `app/(main)/(tabs)/notifications.tsx` 更新

**タスク**:
```bash
# Agent 1: Notifications Tab
1. app/(main)/(tabs)/notifications.tsx 更新
   - NotificationList統合
   - 既読管理
   - Pull-to-refresh
```

### 依存パッケージ
```bash
npm install expo-notifications
```

### コミット戦略
1. Notification & FCM services (TDD)
2. Notification store & hooks
3. Notification components (TDD)
4. Notifications tab update

---

## 🚀 Phase 6: ソーシャルログイン

### 概要
Google、Instagram、Xでのログイン

### 前提条件
- ✅ Phase 1完了

### 実装ファイル

#### 1. サービス層
- [ ] `src/services/firebase/socialAuth.ts`

**タスク**:
```bash
# Agent 1: Social Auth Service
1. src/services/firebase/socialAuth.ts 実装
   - signInWithGoogle
   - signInWithInstagram
   - signInWithX
   - linkAccount
```

#### 2. UIコンポーネント
- [ ] `src/components/auth/SocialLoginButtons.tsx`
- [ ] `src/components/auth/GoogleLoginButton.tsx`
- [ ] `src/components/auth/InstagramLoginButton.tsx`
- [ ] `src/components/auth/XLoginButton.tsx`

**タスク**:
```bash
# Agent 1: Social Login Buttons
1. src/components/auth/SocialLoginButtons.tsx 作成
2. src/components/auth/GoogleLoginButton.tsx 作成
3. src/components/auth/InstagramLoginButton.tsx 作成
4. src/components/auth/XLoginButton.tsx 作成
```

#### 3. 認証画面更新
- [ ] `app/(auth)/login.tsx` 更新
- [ ] `app/(auth)/signup.tsx` 更新

**タスク**:
```bash
# Agent 1: Auth Screens Update
1. app/(auth)/login.tsx にSocialLoginButtons追加
2. app/(auth)/signup.tsx にSocialLoginButtons追加
```

### 依存パッケージ
```bash
npm install expo-auth-session expo-crypto
```

### 設定
- Firebase Console: ソーシャルプロバイダー有効化
- Google Cloud: OAuth 2.0クライアントID設定
- Instagram/X: Developer Apps設定

### コミット戦略
1. Social auth service
2. Social login components
3. Auth screens update

---

## 🚀 Phase 7: 設定・プロフィール機能

### 概要
ユーザー設定とプロフィール編集

### 前提条件
- ✅ Phase 1完了

### 実装ファイル

#### 1. フック
- [ ] `src/hooks/useUserSettings.ts`

**タスク**:
```bash
# Agent 1: Settings Hook
1. src/hooks/useUserSettings.ts 実装
   - プロフィール更新
   - パスワード変更
   - アカウント削除
   - 通知設定
```

#### 2. UIコンポーネント
- [ ] `src/components/settings/SettingsSection.tsx`
- [ ] `src/components/settings/NotificationSettings.tsx`
- [ ] `src/components/settings/ProfileEdit.tsx`

**タスク**:
```bash
# Agent 1: Settings Components
1. src/components/settings/SettingsSection.tsx 作成
2. src/components/settings/NotificationSettings.tsx 作成
3. src/components/settings/ProfileEdit.tsx 作成
```

#### 3. 画面
- [ ] `app/(main)/settings/profile.tsx`
- [ ] `app/(main)/settings/notifications.tsx`
- [ ] `app/(main)/settings/account.tsx`

**タスク**:
```bash
# Agent 1: Settings Screens
1. app/(main)/settings/profile.tsx 作成
2. app/(main)/settings/notifications.tsx 作成
3. app/(main)/settings/account.tsx 作成
```

#### 4. 設定タブ更新
- [ ] `app/(main)/(tabs)/settings.tsx` 更新

**タスク**:
```bash
# Agent 1: Settings Tab Update
1. app/(main)/(tabs)/settings.tsx 更新
   - 設定メニュー追加
   - ナビゲーション設定
```

### コミット戦略
1. Settings hook
2. Settings components
3. Settings screens
4. Settings tab update

---

## 🚀 Phase 8: チュートリアル機能

### 概要
初回利用時のチュートリアル

### 前提条件
- ✅ 全機能完了

### 実装ファイル

#### 1. サービス
- [ ] `src/services/tutorial.ts`

**タスク**:
```bash
# Agent 1: Tutorial Service
1. src/services/tutorial.ts 実装
   - AsyncStorage統合
   - チュートリアル完了フラグ管理
```

#### 2. フック
- [ ] `src/hooks/useTutorial.ts`

**タスク**:
```bash
# Agent 1: Tutorial Hook
1. src/hooks/useTutorial.ts 実装
```

#### 3. UIコンポーネント
- [ ] `src/components/tutorial/TutorialOverlay.tsx`
- [ ] `src/components/tutorial/TutorialStep.tsx`

**タスク**:
```bash
# Agent 1: Tutorial Components
1. src/components/tutorial/TutorialOverlay.tsx 作成
2. src/components/tutorial/TutorialStep.tsx 作成
```

#### 4. 画面
- [ ] `app/(main)/tutorial.tsx`

**タスク**:
```bash
# Agent 1: Tutorial Screen
1. app/(main)/tutorial.tsx 作成
```

#### 5. アプリ起動時の統合
- [ ] `app/_layout.tsx` 更新

**タスク**:
```bash
# Agent 1: App Layout Update
1. app/_layout.tsx 更新
   - 初回起動判定
   - チュートリアル表示
```

### 依存パッケージ
```bash
npm install @react-native-async-storage/async-storage
```

### コミット戦略
1. Tutorial service & hook
2. Tutorial components
3. Tutorial screen
4. App layout integration

---

## 🚀 Phase 9: 最適化・仕上げ

### 概要
パフォーマンス最適化、エラーハンドリング、アクセシビリティ、E2Eテスト

### 前提条件
- ✅ 全機能完了

### タスク

#### 1. パフォーマンス最適化
```bash
# Agent 1: Performance
1. 画像遅延読み込み（react-native-fast-image）
2. メモ化（useMemo, useCallback, React.memo）
3. 仮想化リスト最適化（FlashList導入）
4. バンドルサイズ分析・削減
```

#### 2. エラーハンドリング強化
```bash
# Agent 2: Error Handling (並行可)
1. エラーバウンダリ実装
2. リトライロジック追加
3. オフライン対応改善
4. エラーメッセージ統一
```

#### 3. アクセシビリティ対応
```bash
# Agent 3: Accessibility (並行可)
1. accessibilityLabel追加
2. Dynamic Type対応
3. スクリーンリーダー対応
4. コントラスト比確認
```

#### 4. E2Eテスト
```bash
# Agent 1: E2E Tests
1. Detox設定
2. 主要フローのE2Eテスト作成
   - 新規登録〜ファミリー作成〜投稿
   - 招待コード参加
   - コメント投稿
```

### 依存パッケージ
```bash
npm install react-native-fast-image
npm install @shopify/flash-list
npm install --save-dev detox
```

### コミット戦略
1. Performance optimizations
2. Error handling improvements
3. Accessibility enhancements
4. E2E test suite

---

## 📊 並行実行戦略

### 推奨パターン1: 2エージェント並行
```
Agent A: Phase 2 (掲示板機能)
Agent B: Phase 6 (ソーシャルログイン) ← 独立実行可

完了後:
Agent A: Phase 3 (コメント機能)
Agent B: Phase 7 (設定機能) ← 独立実行可

完了後:
Agent A: Phase 4 (検索)
Agent B: Phase 5 (通知) ← 並行可

完了後:
Agent A: Phase 8 (チュートリアル)

完了後:
Agent A: Phase 9 パフォーマンス
Agent B: Phase 9 エラーハンドリング
```

### 推奨パターン2: 3エージェント並行
```
Agent A: Phase 2 (掲示板) - Services & Hooks
Agent B: Phase 2 (掲示板) - Components
Agent C: Phase 6 (ソーシャルログイン)

完了後:
Agent A: Phase 3 (コメント) - Services
Agent B: Phase 3 (コメント) - Components
Agent C: Phase 7 (設定)

完了後:
Agent A: Phase 4 (検索)
Agent B: Phase 5 (通知)
Agent C: Phase 8 (チュートリアル)

完了後:
Agent A: Phase 9 パフォーマンス
Agent B: Phase 9 エラーハンドリング
Agent C: Phase 9 アクセシビリティ
```

---

## 🎯 各フェーズの開始コマンド例

### Phase 2開始
```
Phase 2（掲示板機能）を実装してください。
- TDDアプローチで進めること
- MCPツール（Serena, Context7）を積極的に活用
- 機能ごとに小さくコミット・push
- 全テスト合格を確認
```

### 並行実行開始
```
# セッション1
Phase 2のサービス層とフック（usePosts, usePost, useImagePicker）を実装してください。

# セッション2（別ウィンドウ）
Phase 2のUIコンポーネント（PostCard, PostList, PostForm等）を実装してください。

# セッション3（別ウィンドウ）
Phase 6のソーシャルログイン機能を実装してください。
```

---

## 📝 注意事項

1. **TDD厳守**: 各フェーズでテストを先に書く
2. **MCP活用**: Serena（コード操作）、Context7（ドキュメント参照）を使う
3. **小さなコミット**: 機能単位で細かくコミット
4. **テスト確認**: `npm test` で全テスト合格を確認してからpush
5. **依存関係**: 各フェーズの「前提条件」を確認
6. **並行作業**: 独立したフェーズは並行実行可能

---

## 🔗 参考ドキュメント

- [family.md](family.md) - 要件定義
- [CLAUDE.md](CLAUDE.md) - プロジェクト概要
- [implementation-plan.md](implementation-plan.md) - 詳細実装計画
