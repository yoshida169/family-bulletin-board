# 家族の掲示板 (Family Bulletin Board)

家族間でメッセージや写真を共有し、掲示板を通じてつながりを保つためのコミュニケーションアプリです。

## 概要

- 家族グループ（ファミリー）を作成し、メンバーを招待
- 掲示板で投稿やコメントを共有
- 写真の投稿・共有機能
- プッシュ通知による更新のお知らせ
- 管理者/子供の役割に基づいたアクセス制御

## 技術スタック

- **Frontend**: React Native + Expo (SDK 54)
- **Routing**: Expo Router (file-based routing)
- **Backend**: Firebase (Auth, Firestore, Storage, FCM)
- **State Management**: Zustand + React Context
- **Forms**: React Hook Form + Zod
- **Testing**: Jest + React Testing Library

## 必要な環境

- Node.js 18 以上
- npm または yarn
- Expo CLI
- iOS Simulator (macOS) / Android Emulator / 実機
- Firebase プロジェクト（本番環境用）

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

Firebase の設定情報を環境変数または設定ファイルに追加してください。

## ローカル環境での起動方法

### 開発サーバーの起動

```bash
npm start
```

Expo の開発サーバーが起動し、QR コードが表示されます。

### プラットフォーム別の起動

```bash
# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# Web ブラウザ
npm run web
```

### Firebase Emulator の使用（オプション）

ローカルで Firebase をエミュレートして開発する場合：

```bash
firebase emulators:start
```

エミュレーターのポート：

- Auth: 9099
- Firestore: 8080
- Storage: 9199
- Emulator UI: 4000

## 自動テストの実行方法

### 全テストの実行

```bash
npm test
```

### ウォッチモードでテスト実行

ファイル変更時に自動でテストが再実行されます。

```bash
npm run test:watch
```

### カバレッジレポート付きでテスト実行

```bash
npm run test:coverage
```

## ディレクトリ構成

```
app/                    # Expo Router スクリーン
├── (auth)/            # 認証画面 (ログイン, サインアップ, パスワードリセット)
├── (main)/            # 認証後の画面
│   └── (tabs)/        # タブナビゲーション (ホーム, ファミリー, 通知, 設定)
└── _layout.tsx        # ルートレイアウト

src/
├── components/ui/     # 再利用可能なUIコンポーネント
├── hooks/             # カスタムReact Hooks
├── services/firebase/ # Firebase サービス層
├── store/             # Zustand ストア
├── types/             # TypeScript 型定義
├── constants/         # 定数 (色, レイアウト, 続柄)
└── utils/             # ユーティリティ関数
```

## ライセンス

Private
