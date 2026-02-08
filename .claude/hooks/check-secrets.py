#!/usr/bin/env python3
"""
秘匿情報チェックスクリプト

git commit前にステージングされた変更をチェックし、
秘匿情報が含まれている場合はcommitをブロックします。
"""

import json
import re
import subprocess
import sys
from typing import List, Tuple

# 秘匿情報のパターン（パターン, 説明）
SECRET_PATTERNS = [
    # APIキー
    (r'(?i)api[_-]?key\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})', "APIキー"),
    (r'(?i)secret[_-]?key\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})', "シークレットキー"),
    (r'(?i)access[_-]?key\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})', "アクセスキー"),
    (r'(?i)auth[_-]?token\s*[=:]\s*["\']?([a-zA-Z0-9_\-]{20,})', "認証トークン"),

    # Firebase固有
    (r'(?i)apiKey\s*[=:]\s*["\']AIza[a-zA-Z0-9_\-]{35}["\']', "Firebase APIキー"),
    (r'(?i)messagingSenderId\s*[=:]\s*["\']?\d{12}', "Firebase Messaging Sender ID"),

    # パスワード
    (r'(?i)password\s*[=:]\s*["\']([^"\'\s]{8,})["\']', "パスワード"),
    (r'(?i)passwd\s*[=:]\s*["\']([^"\'\s]{8,})["\']', "パスワード"),
    (r'(?i)pwd\s*[=:]\s*["\']([^"\'\s]{8,})["\']', "パスワード"),

    # AWS
    (r'(?i)aws_access_key_id\s*[=:]\s*["\']?(AKIA[A-Z0-9]{16})', "AWS Access Key"),
    (r'(?i)aws_secret_access_key\s*[=:]\s*["\']?([a-zA-Z0-9/+=]{40})', "AWS Secret Key"),

    # 秘密鍵
    (r'-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----', "秘密鍵"),

    # 汎用シークレット
    (r'(?i)secret\s*[=:]\s*["\']([a-zA-Z0-9_\-]{16,})["\']', "汎用シークレット"),
    (r'(?i)token\s*[=:]\s*["\']([a-zA-Z0-9_\-]{20,})["\']', "トークン"),
]

# 除外パターン（ダミー値、プレースホルダー）
EXCLUDE_PATTERNS = [
    r'(?i)(YOUR|PLACEHOLDER|EXAMPLE|DUMMY|FAKE|TEST|SAMPLE)',
    r'(?i)(xxx|yyy|zzz|\*\*\*|###)',
    r'(?i)(test_key|fake_key|demo_key)',
    r'(?i)(localhost|127\.0\.0\.1|0\.0\.0\.0)',
    r'^[\*x]+$',  # マスクされた値
]

# 除外ファイルパターン
EXCLUDE_FILES = [
    r'\.md$',  # Markdownファイル
    r'\.txt$',  # テキストファイル
    r'package-lock\.json$',
    r'yarn\.lock$',
    r'pnpm-lock\.yaml$',
]


def is_excluded_value(value: str) -> bool:
    """除外パターンにマッチするかチェック"""
    for pattern in EXCLUDE_PATTERNS:
        if re.search(pattern, value):
            return True
    return False


def is_excluded_file(filepath: str) -> bool:
    """除外ファイルパターンにマッチするかチェック"""
    for pattern in EXCLUDE_FILES:
        if re.search(pattern, filepath):
            return True
    return False


def check_secrets_in_diff() -> List[Tuple[str, str, str]]:
    """
    git diff --cachedで秘匿情報をチェック

    Returns:
        List[(filepath, secret_type, matched_line)]
    """
    try:
        # ステージングされた変更を取得
        result = subprocess.run(
            ["git", "diff", "--cached"],
            capture_output=True,
            text=True,
            check=True
        )
        diff_output = result.stdout
    except subprocess.CalledProcessError:
        # git diffが失敗した場合は何もしない
        return []

    if not diff_output:
        # 変更がない場合
        return []

    secrets = []
    current_file = None

    for line in diff_output.split('\n'):
        # ファイル名を取得
        if line.startswith('+++'):
            match = re.match(r'\+\+\+ b/(.+)', line)
            if match:
                current_file = match.group(1)
                continue

        # 追加された行のみチェック（削除された行は無視）
        if not line.startswith('+') or line.startswith('+++'):
            continue

        # 除外ファイルはスキップ
        if current_file and is_excluded_file(current_file):
            continue

        # 秘匿情報パターンをチェック
        for pattern, secret_type in SECRET_PATTERNS:
            match = re.search(pattern, line)
            if match:
                # マッチした値を取得
                matched_value = match.group(0)

                # 除外パターンに該当する場合はスキップ
                if is_excluded_value(matched_value):
                    continue

                secrets.append((current_file or "unknown", secret_type, line.strip()))

    return secrets


def main():
    """メイン処理"""
    try:
        # stdinからJSON入力を読み込む
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        # JSON読み込みエラー - 静かに終了
        sys.exit(0)

    # Bashツールのみを処理
    tool_name = input_data.get("tool_name", "")
    if tool_name != "Bash":
        sys.exit(0)

    # git commitコマンドかチェック
    tool_input = input_data.get("tool_input", {})
    command = tool_input.get("command", "")

    if not re.search(r'\bgit\s+commit\b', command):
        # git commit以外は処理しない
        sys.exit(0)

    # 秘匿情報をチェック
    secrets = check_secrets_in_diff()

    if not secrets:
        # 秘匿情報が見つからなければ通過
        sys.exit(0)

    # 秘匿情報が見つかった場合、エラーメッセージを出力
    print("\n🔒 秘匿情報の可能性がある内容が検出されました\n", file=sys.stderr)

    # ファイルごとにグループ化
    files_with_secrets = {}
    for filepath, secret_type, line in secrets:
        if filepath not in files_with_secrets:
            files_with_secrets[filepath] = []
        files_with_secrets[filepath].append((secret_type, line))

    # 検出内容を表示
    for filepath, items in files_with_secrets.items():
        print(f"📁 ファイル: {filepath}", file=sys.stderr)
        for secret_type, line in items:
            print(f"   種類: {secret_type}", file=sys.stderr)
            # 行の内容を表示（長すぎる場合は切り詰め）
            display_line = line if len(line) <= 80 else line[:77] + "..."
            print(f"   内容: {display_line}", file=sys.stderr)
        print("", file=sys.stderr)

    print("⚠️  これらの内容を確認し、必要に応じて削除またはgitignoreに追加してください。", file=sys.stderr)
    print("   環境変数や設定ファイルは.envファイルなどに分離することを推奨します。\n", file=sys.stderr)

    # 終了コード2でブロック
    sys.exit(2)


if __name__ == "__main__":
    main()
