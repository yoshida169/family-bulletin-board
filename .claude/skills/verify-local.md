---
description: ローカル環境でプロジェクトの動作確認を行う
argument-hint: [check-type]
---

# ローカル環境動作確認

## 目的

開発を始める前、または変更後にローカル環境が正常に動作することを確認する。

## 引数（オプション）

- `all` (デフォルト): すべての確認を実行
- `deps`: 依存関係のみ
- `lint`: Lint/型チェックのみ
- `test`: テストのみ
- `emulator`: Firebaseエミュレーターのみ
- `build`: ビルド確認のみ

## 確認項目

### 1. 依存関係の確認

```bash
# package.jsonとnode_modulesの整合性確認
npm ls --depth=0
```

- `node_modules` が存在し、`package.json` と同期している
- 重大な脆弱性がない (`npm audit` で確認)
- 不足しているパッケージがあれば `npm install`

### 2. TypeScript型チェック

```bash
# tsconfig.jsonに基づく型チェック
npx tsc --noEmit
```

- 型エラーがない
- パスエイリアス (`@/*`, `@components/*` など) が解決できる

### 3. ESLint/コード品質

```bash
# ESLintでコード品質確認
npm run lint
```

- Lintエラーがない
- 警告がある場合は内容を確認し、必要に応じて修正

### 4. テスト実行

```bash
# すべてのテストを実行
npm test -- --passWithNoTests

# カバレッジ確認（オプション）
npm run test:coverage
```

- すべてのテストがパスする
- スナップショットが古い場合は更新が必要か確認
- カバレッジが基準を満たしているか確認（ユーティリティは100%目標）

### 5. Firebaseエミュレーター（環境構築済みの場合）

```bash
# firebase.jsonが存在するか確認
test -f firebase.json && echo "Firebase設定あり" || echo "Firebase設定なし"

# エミュレーターを起動（別ターミナルで）
firebase emulators:start
```

- `firebase.json` が存在する
- エミュレーターが起動できる（Auth: 9099, Firestore: 8080, Storage: 9199）
- UIが http://localhost:4000 でアクセスできる

### 6. 開発サーバー起動確認

```bash
# Expo開発サーバー起動
npm start
```

- Metro bundlerが起動する
- QRコードが表示される
- エラーなくバンドルが完了する

### 7. ビルド確認（時間がかかる場合はスキップ可）

```bash
# TypeScriptビルド（Web向け）
npx expo export --platform web
```

- ビルドが成功する
- 重大なwarningがない

## 実行フロー

1. **引数解析**: `$ARGUMENTS` が指定されていればその項目のみ実行、なければ全項目実行
2. **依存関係チェック**: `npm ls` でパッケージ確認、問題があれば `npm install` を提案
3. **型チェック**: `npx tsc --noEmit` で型エラー確認
4. **Lint実行**: `npm run lint` でコード品質確認
5. **テスト実行**: `npm test` でテスト確認
6. **Firebase確認**: `firebase.json` の存在確認、エミュレーター起動方法を案内
7. **開発サーバー**: `npm start` の実行方法を案内（バックグラウンドでの実行は非推奨）
8. **結果サマリー**: すべての確認結果を表形式で出力

## 出力形式

```markdown
# ローカル環境動作確認結果

| 確認項目 | 状態 | 詳細 |
|---------|------|------|
| 依存関係 | ✅ / ⚠️ / ❌ | ... |
| 型チェック | ✅ / ❌ | ... |
| Lint | ✅ / ⚠️ / ❌ | ... |
| テスト | ✅ / ❌ | ... |
| Firebase設定 | ✅ / ⚠️ / - | ... |

## 推奨アクション

- [ ] ...
- [ ] ...
```

## 注意事項

- 開発サーバーやエミュレーターは長時間実行されるため、起動コマンドのみ案内し、ユーザーが手動で実行できるようにする
- エラーが発生した場合は、具体的なエラーメッセージと修正方法を提示する
- このスキルは読み取り専用の確認が中心。修正が必要な場合は別途対応する

## 関連コマンド

```bash
# 依存関係の再インストール
rm -rf node_modules package-lock.json && npm install

# キャッシュクリア
npx expo start -c

# 特定のテストファイルのみ実行
jest path/to/test-file.test.ts

# Firebaseエミュレーター停止
# Ctrl+C または firebase emulators:stop
```
