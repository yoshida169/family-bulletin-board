# Claude Code Hooks

このディレクトリには、Claude Codeのhooks機能で使用するスクリプトが含まれています。

## セットアップ済みのHooks

### 秘匿情報チェック (check-secrets.py)

**目的**: git commit前に、ステージングされた変更に秘匿情報が含まれていないかチェックします。

**トリガー**: `git commit`コマンドの実行前（PreToolUse hook）

**チェック内容**:
- APIキー、シークレットキー、アクセストークン
- Firebase設定（apiKey, messagingSenderId など）
- パスワード
- AWS認証情報
- 秘密鍵（RSA、EC、DSA、OpenSSH）
- その他の汎用シークレット値

**除外パターン**:
- ダミー値、プレースホルダー（`YOUR_API_KEY`, `PLACEHOLDER`, `EXAMPLE`など）
- テスト用のキー（`test_key`, `fake_key`など）
- マスクされた値（`xxx`, `***`など）

**除外ファイル**:
- ドキュメントファイル（`.md`, `.txt`）
- ロックファイル（`package-lock.json`, `yarn.lock`など）

**動作**:
1. `git commit`コマンドを検出
2. `git diff --cached`でステージングされた変更を取得
3. 追加された行（`+`で始まる行）をチェック
4. 秘匿情報のパターンにマッチする場合、commitをブロック

**検出時の出力例**:
```
🔒 秘匿情報の可能性がある内容が検出されました

📁 ファイル: src/config/firebase.ts
   種類: Firebase APIキー
   内容: apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

⚠️  これらの内容を確認し、必要に応じて削除またはgitignoreに追加してください。
   環境変数や設定ファイルは.envファイルなどに分離することを推奨します。
```

## Hook設定

設定ファイル: `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/check-secrets.py",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## カスタマイズ

### チェックパターンの追加

`check-secrets.py`の`SECRET_PATTERNS`リストに新しいパターンを追加できます：

```python
SECRET_PATTERNS = [
    # 既存のパターン...

    # カスタムパターン
    (r'(?i)your_pattern_here', "説明"),
]
```

### 除外パターンの追加

特定の値を除外したい場合は、`EXCLUDE_PATTERNS`に追加します：

```python
EXCLUDE_PATTERNS = [
    # 既存のパターン...

    # カスタム除外パターン
    r'your_exclude_pattern',
]
```

### 除外ファイルの追加

特定のファイルをチェック対象から除外したい場合は、`EXCLUDE_FILES`に追加します：

```python
EXCLUDE_FILES = [
    # 既存のパターン...

    # カスタム除外ファイル
    r'path/to/exclude\.json$',
]
```

## トラブルシューティング

### Hookが動作しない

1. スクリプトに実行権限があることを確認:
   ```bash
   chmod +x .claude/hooks/check-secrets.py
   ```

2. Python 3がインストールされていることを確認:
   ```bash
   python3 --version
   ```

3. デバッグモードで実行:
   ```bash
   claude --debug
   ```

### 誤検知が多い

- `EXCLUDE_PATTERNS`または`EXCLUDE_FILES`に除外パターンを追加
- チェックパターンの正規表現を調整

## 参考

- [Claude Code Hooks Documentation](https://code.claude.com/docs/ja/hooks)
- [Hooks Reference](https://code.claude.com/docs/ja/hooks-reference)
