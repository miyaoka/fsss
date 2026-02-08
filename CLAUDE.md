# fsss

**fsss** — File Structure, Single Schema

ファイル構造がそのままコマンド構造になり、スキーマを一回書けば CLI フラグ・環境変数・設定ファイルのどこから値が来ても同じように型付きで受け取れるフレームワーク。

A CLI framework where your file structure becomes your command structure, and a single schema gives you typed values whether they come from flags, env vars, or config files.

bun + TypeScript ネイティブ。

## 開発コマンド

- `pnpm dev` — 開発モード（watch）
- `pnpm build` — ビルド
- `pnpm test:all` — テスト
- `pnpm typecheck:all` — 全ワークスペースの型チェック
- `pnpm lint:all` — リント
- `pnpm fix` — フォーマット（root のみ）
- `pnpm fix:all` — リント + フォーマット自動修正

## ワークスペース構成

```
fsss/
├── packages/fsss/     # フレームワーク本体（npm publish 対象）
└── apps/example/      # サンプル CLI アプリ（動作確認・テスト用）
```

## フレームワーク内部のモジュール構成

| モジュール     | 責務                                                                             |
| -------------- | -------------------------------------------------------------------------------- |
| `cli`          | エントリポイント。`createCLI` を提供し、パイプライン全体を制御する               |
| `router`       | `commands/` を走査してコマンドファイルを特定。動的セグメントから `params` を抽出 |
| `parser`       | 残りトークンを `--flag` / `-f` / 位置引数に分類                                  |
| `resolver`     | CLI flag > env > config > default の優先順位で値を解決                           |
| `validator`    | Zod スキーマで型変換 + バリデーション                                            |
| `help`         | args 定義からヘルプ文字列を生成                                                  |
| `config`       | config ファイルの読み込み・マージ                                                |
| `auto-mapping` | コマンドパス + arg 名から env 名・config パスを自動導出                          |
| `types`        | `defineCommand` の型定義。Zod スキーマからハンドラ引数の型を推論                 |
| `zod-utils`    | Zod スキーマの型判定ユーティリティ                                               |

## ドキュメント

詳細は [docs/](docs/README.md) を参照。
