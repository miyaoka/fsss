# fsss

**fsss** — "File Structure, Single Schema" — bun + TypeScript + Zod

> ファイル構造がそのままコマンド構造になり、スキーマを一回書けば CLI フラグ・環境変数・設定ファイルのどこから値が来ても同じように型付きで受け取れる CLI フレームワーク
>
> _A CLI framework where your file structure becomes your command structure, and a single schema gives you typed values whether they come from flags, env vars, or config files._

## File Structure — ファイルを置くだけでコマンドが生える

```
commands/
  serve.ts              → my-app serve
  config/
    set.ts              → my-app config set
    get.ts              → my-app config get
  remote/
    [name]/
      push.ts           → my-app remote origin push
```

ファイルを置くだけでコマンドが生える。ディレクトリのネストがサブコマンドの階層になる。`[name]` は動的セグメントで、`params.name` として値を受け取れる。

## Single Schema — 1つの定義で CLI / env / config を統合

```ts
// commands/serve.ts
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
    // args.port: number, args.host: string — 型推論される
    console.log(`${args.host}:${args.port}`);
  },
});
```

この1つの定義だけで、CLI フラグ・環境変数・設定ファイル・デフォルト値のすべてが統合される。

```
CLI flag        my-app serve --port 8080           ← 最優先
env             MYAPP_SERVE_PORT=5000              ← prefix + コマンドパス + arg 名で自動導出
config file     { "serve": { "port": 4000 } }     ← コマンドツリーと同じ構造
default         3000
```

どのソースから来た値も、最終的に同じ Zod スキーマでバリデーションされる。

### 環境変数の自動マッピング

`autoEnv` を指定すると、コマンドパス + arg 名から環境変数名を自動導出する。

```ts
const cli = createCLI({
  name: "my-app",
  autoEnv: { prefix: "MYAPP" },
});
```

| コマンド      | arg     | 自動導出される env 名     |
| ------------- | ------- | ------------------------- |
| `serve`       | `port`  | `MYAPP_SERVE_PORT`        |
| `remote push` | `force` | `MYAPP_REMOTE_PUSH_FORCE` |

### 設定ファイルの自動マッピング

config ファイルの JSON 構造はコマンドツリーと一致する。

```json
{
  "serve": { "port": 5000, "host": "0.0.0.0" },
  "remote": { "push": { "force": true } }
}
```

```
my-app --config app.json serve
```

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
