# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**家族の掲示板 (Family Bulletin Board)** - 家族間でメッセージや写真を共有する掲示板アプリ。React Native + Expo で構築。

## Development Commands

```bash
npm start                          # Expo開発サーバー起動
npm run ios / android / web        # プラットフォーム指定起動

npm test                           # 全テスト実行
npm run test:watch                 # watchモード
npm run test:coverage              # カバレッジ付き
jest path/to/test-file.test.ts     # 個別テスト
jest -t "test name pattern"        # パターン指定

firebase emulators:start           # Firebase Emulator (Auth:9099, Firestore:8080, Storage:9199, UI:4000)
```

## Tech Stack

- **Frontend**: React Native + Expo (SDK 54), Expo Router (file-based routing)
- **Backend**: Firebase (Auth, Firestore, Storage, FCM) via `@react-native-firebase`
- **State**: Zustand (authStore, familyStore)
- **Forms**: React Hook Form + Zod (validation schemas in `src/utils/validation.ts`)
- **Testing**: Jest (jest-expo preset) + React Testing Library

## Architecture

### State Flow

```
Components → Zustand Stores → Service Layer → Firebase
```

- **コンポーネント**: UIロジックのみ。Firebase直接呼び出し禁止
- **Zustand Stores** (`src/store/`): `authStore`と`familyStore`の2つ。エラーハンドリングと日本語エラーメッセージはここで管理
- **Service Layer** (`src/services/firebase/`): Firebase操作をラップ。エラーはthrowしてstoreに委ねる。Firebase Timestamp → JS Date変換はここで行う

### Routing (Expo Router)

```
app/_layout.tsx          # useProtectedRoute()でauth guard
app/(auth)/              # 未認証ユーザー用 (login, signup, forgot-password)
app/(main)/(tabs)/       # 認証済みユーザー用 4タブ (掲示板, ファミリー, 通知, 設定)
app/(main)/family/[id]/  # ファミリー詳細 → board/[boardId] → post/[postId]
```

### Data Model (Firestore)

```
/users/{userId}
/families/{familyId}
  /members/{memberId}
  /boards/{boardId}
    /posts/{postId}
      /comments/{commentId}
  /invitations/{invitationId}
```

### Roles

- **admin**: フル権限（ファミリー編集、メンバー招待、掲示板作成、全投稿削除）
- **child**: 制限付き（投稿・コメント作成、自分のコンテンツ編集のみ）

### Path Aliases (`tsconfig.json`)

`@components/*`, `@hooks/*`, `@services/*`, `@store/*`, `@types/*`, `@utils/*`, `@constants/*` → 各`src/`サブディレクトリ

### Component Organization

- Feature別ディレクトリ (`components/board/`, `components/family/`, `components/post/`, `components/ui/`)
- 各ディレクトリに`index.ts`バレルエクスポート
- UIコンポーネントはvariant/sizeプロパティ、`useColorScheme()`でダーク/ライトモード対応

### Key Patterns

- **Batch Operations**: 複数ドキュメント更新にFirebase batchを使用（投稿作成時のカウント更新等）
- **Real-time + Pagination**: 投稿はリアルタイム`onSnapshot`+ページネーション（20件/ページ、`lastPostDate`カーソル）
- **Timestamp管理**: Firebase Timestamp → JS Date変換はService Layer境界で実行
- **Validation**: Zodスキーマで定義、日本語エラーメッセージ

## Development Guidelines

### ユビキタス言語（日本語ドメイン用語）

- **ファミリー**: Family group / **ファミリーメンバー**: Member
- **続柄**: Relationship (お父さん, お母さん, etc.) - `src/constants/relations.ts`で定義
- **掲示板**: Bulletin board / **投稿**: Post / **招待コード**: Invitation code

### TDD

テストファースト。`__tests__/`にテスト、`__mocks__/`にFirebase等のモックファイル配置。

### Testing

- Firebase mocksは`__mocks__/@react-native-firebase/`で定義（チェーン可能なメソッド構造）
- Jest path aliasesは`jest.config`でtsconfigと一致するよう設定済み

## Security

### Secret Detection Hook

git commit前に秘匿情報を自動チェックする[Claude Code hook](.claude/hooks/README.md)が設定済み。APIキー、Firebase設定、パスワード等が検出されるとcommitがブロックされる。

## MCP (Model Context Protocol)

利用可能なMCPサーバーがある場合は積極的に活用すること。

## Documentation Reference

- [requirements.md](doc/requirements.md) - 要件定義書
- [design.md](doc/design.md) - 設計書
- [implementation-plan.md](doc/implementation-plan.md) - 実装計画・タスク分解
