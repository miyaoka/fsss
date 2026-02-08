# fsss

**fsss** — File Structure, Single Schema

ファイル構造がそのままコマンド構造になり、スキーマを一回書けば CLI フラグ・環境変数・設定ファイルのどこから値が来ても同じように型付きで受け取れるフレームワーク。

A CLI framework where your file structure becomes your command structure, and a single schema gives you typed values whether they come from flags, env vars, or config files.

bun + TypeScript ネイティブ。

## コアコンセプト

fsss は2つの柱で成り立つ。

- **File Structure** — `commands/` ディレクトリのファイル構造がそのままコマンドツリーになる。コマンドの登録コードは不要
- **Single Schema** — 各コマンドファイルに書く1つのスキーマ定義が、CLI フラグ・環境変数・設定ファイル・デフォルト値の全てを統一的に扱い、型付きの値をハンドラに渡す

## クイックスタート

### エントリポイント

```ts
import { createCLI } from "fsss";

const cli = createCLI({
  name: "my-app",
  autoEnv: { prefix: "MYAPP" },
});
await cli.run();
```

### コマンドファイル

`commands/serve.ts` を置くだけで `my-app serve` が使えるようになる。

```ts
import { defineCommand } from "fsss";
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
  },
  run({ args }) {
    console.log(`Server starting on ${args.host}:${args.port}`);
  },
});
```

### 値の優先順位

同じ `port` に対して複数のソースから値を指定できる。上が最優先。

```
CLI flag        my-app serve --port 8080
env             MYAPP_SERVE_PORT=5000
config file     { "serve": { "port": 4000 } }
default         3000
```

どのソースから来た値も、最終的に同じ Zod スキーマでバリデーションされる。

### ヘルプ自動生成

```
$ my-app serve --help

サーバーを起動する

Usage: my-app serve [options]

Options:
  -p, --port <port>  ポート番号 (env: MYAPP_SERVE_PORT, default: 3000)
      --host <host>  ホスト名 (env: MYAPP_SERVE_HOST, default: localhost)
  -h, --help         ヘルプを表示する
```

## ドキュメント

- [ファイルベースルーティング](docs/routing.md) — コマンドツリー、動的セグメント、params と args の分離
- [スキーマと値の解決](docs/schema.md) — defineCommand、args 定義、値の優先順位、ヘルプ生成
- [設定ファイルと環境変数](docs/config.md) — autoEnv、config ファイル階層、`--config` フラグ
- [内部アーキテクチャ](docs/architecture.md) — パイプライン設計、各モジュールの責務、処理トレース
- [既存ツールとの比較](docs/comparison.md) — commander / oclif / Pastel / Gud CLI / convict との比較
