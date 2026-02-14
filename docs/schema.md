# スキーマと値の解決

## defineCommand

各コマンドファイルは `defineCommand` を default export する。

```ts
// commands/serve.ts
import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "サーバーを起動する",
  args: {
    port: {
      type: z.coerce.number().min(1).max(65535),
      description: "ポート番号",
      alias: "p",
      default: 3000,
    },
    host: {
      type: z.string(),
      description: "ホスト名",
      default: "localhost",
    },
    verbose: {
      type: z.boolean(),
      description: "詳細ログ",
      alias: "v",
      default: false,
    },
  },
  run({ args }) {
    // 全て型推論される
    args.port; // number
    args.host; // string
    args.verbose; // boolean
  },
});
```

## args 定義の各フィールド

| フィールド    | 必須 | 説明                                                                    |
| ------------- | ---- | ----------------------------------------------------------------------- |
| `type`        | ✓    | Zod スキーマ。型変換とバリデーションを担う                              |
| `description` | ✓    | ヘルプに表示される説明文                                                |
| `alias`       |      | 短縮フラグ（`-p` 等）                                                   |
| `positional`  |      | `true` なら位置引数として扱う                                           |
| `default`     |      | デフォルト値                                                            |
| `env`         |      | 環境変数名を明示指定（`autoEnv` による自動導出を上書き）                |
| `config`      |      | config ファイルのキーパスを明示指定（自動導出を上書き）                 |
| `multiple`    |      | `true` なら配列として受け取る（`--filter a --filter b` → `["a", "b"]`） |

## 値の解決フロー

1つの args 定義に対し、複数のソースから値を探索して優先順位でマージする。

```
CLI flag        --port 8080           ← 最優先
                    ↓ なければ
positional      <port>
                    ↓ なければ
env             MYAPP_SERVE_PORT=5000
                    ↓ なければ
config file     { "serve": { "port": 4000 } }
                    ↓ なければ
default         3000
                    ↓
                z.coerce.number().min(1).max(65535).parse(解決された値)
                    ↓
                args.port: number     型付きの値がハンドラに届く
```

どのソースから来た値も、最終的に同じ Zod スキーマでバリデーションされる。`z.coerce` により、環境変数の文字列 `"5000"` も自動的に `number` に変換される。

## ヘルプ自動生成

args 定義からヘルプを自動生成する。`autoEnv` が設定されている場合、自動導出された env 名も表示される。

```
$ my-app serve --help

サーバーを起動する

Usage: my-app serve [options]

Options:
  -p, --port <port>  ポート番号 (env: MYAPP_SERVE_PORT, default: 3000)
      --host <host>  ホスト名 (env: MYAPP_SERVE_HOST, default: localhost)
  -v, --verbose      詳細ログ
  -h, --help         ヘルプを表示する
```

`defaultCommand` が設定されている場合、`my-app --help` でサブコマンド一覧とデフォルトコマンドの Options を統合表示する。

```
$ my-app --help

サーバーを起動する

Usage: my-app [options]
       my-app <command>

Options:
  -p, --port <port>  ポート番号 (env: MYAPP_SERVE_PORT, default: 3000)
      --host <host>  ホスト名 (env: MYAPP_SERVE_HOST, default: localhost)
  -v, --verbose      詳細ログ
  -h, --help         ヘルプを表示する

Available commands:
  serve (default)
  build
  config
```
