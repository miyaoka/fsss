# fsss

**fsss** — File Structure, Single Schema

ファイル構造がそのままコマンド構造になり、スキーマを一回書けば CLI フラグ・環境変数・設定ファイルのどこから値が来ても同じように型付きで受け取れるフレームワーク。

A CLI framework where your file structure becomes your command structure, and a single schema gives you typed values whether they come from flags, env vars, or config files.

bun + TypeScript ネイティブ。

## 開発コマンド

- `pnpm dev` — 開発モード（watch）
- `pnpm build` — ビルド
- `pnpm test:all` — テスト
- `pnpm typecheck` — 型チェック（root のみ）
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

## コアコンセプト

fsss は2つの柱で成り立つ。

- **File Structure** — `commands/` ディレクトリのファイル構造がそのままコマンドツリーになる。コマンドの登録コードは不要
- **Single Schema** — 各コマンドファイルに書く1つのスキーマ定義が、CLI フラグ・環境変数・設定ファイル・デフォルト値の全てを統一的に扱い、型付きの値をハンドラに渡す

## ファイルベースルーティング

### 基本

```
commands/
  index.ts          # my-app（引数なしで実行）
  serve.ts          # my-app serve
  user/
    index.ts        # my-app user（デフォルトサブコマンド）
    list.ts         # my-app user list
    delete.ts       # my-app user delete
  config/
    set.ts          # my-app config set
    get.ts          # my-app config get
```

ファイルを置くだけでコマンドが生える。ディレクトリのネストがサブコマンドの階層になる。

### 動的セグメント

ディレクトリ名に `[param]` を使うと、その位置の値が `params` として抽出される。

```
commands/
  remote/
    [name]/
      push.ts       # my-app remote origin push → params.name = "origin"
      status.ts     # my-app remote origin status
```

これは Web ルーティングの `/remote/:name/push` と同じ概念。コマンド解決の**途中**に変数が挟まるケースでのみ使う。末端の値は動的セグメントではなく引数（args）で受け取る。

### ルーターの動作

ルーターは `process.argv` のトークンを1つずつ消費しながら `commands/` ディレクトリを掘り進み、ファイルに当たったら止まる。

```
入力: ["user", "delete", "alice", "bob", "--force"]

1. "user"    → commands/user/       ディレクトリ発見。消費
2. "delete"  → commands/user/delete.ts  ファイル発見。消費
3. 残り      → ["alice", "bob", "--force"] を引数パーサーへ
```

動的セグメントがある場合:

```
入力: ["remote", "origin", "push", "--force"]

1. "remote"  → commands/remote/         ディレクトリ発見。消費
2. "origin"  → commands/remote/[name]/  動的セグメント発見。消費。params = { name: "origin" }
3. "push"    → commands/remote/[name]/push.ts  ファイル発見。消費
4. 残り      → ["--force"] を引数パーサーへ
```

ルーターが解決するのはコマンドファイルの特定まで。残りのトークンはパーサーとリゾルバーの仕事。

## params と args の分離

Web フレームワークの `req.params` と `req.query` の分離と同じ構造。

|              | params                          | args                               |
| ------------ | ------------------------------- | ---------------------------------- |
| 誰が作る     | ルーター                        | パーサー + リゾルバー              |
| 何から来る   | ディレクトリ名 `[name]`         | CLI フラグ、位置引数、env、config  |
| Web で言うと | `/users/:id` の `req.params.id` | `?force=true` の `req.query.force` |

```ts
// commands/remote/[name]/push.ts
export default defineCommand({
  args: {
    branch: { type: z.string(), positional: true, description: "ブランチ名" },
    force: { type: z.boolean(), default: false, description: "強制プッシュ", alias: "f" },
  },
  run({ params, args }) {
    params.name; // "origin" — ルーターが [name] から抽出
    args.branch; // "main"   — パーサーが位置引数から取得
    args.force; // true     — パーサーが --force から取得
  },
});
```

## コマンドファイルの形: defineCommand

各コマンドファイルは `defineCommand` を default export する。

```ts
// commands/serve.ts
import { defineCommand } from "fsss";
import { z } from "zod";

export default defineCommand({
  description: "サーバーを起動する",
  args: {
    port: {
      type: z.coerce.number().min(1).max(65535),
      description: "ポート番号",
      alias: "p",
      positional: false,
      default: 3000,
      env: "PORT",
      config: "server.port",
    },
    host: {
      type: z.string(),
      description: "ホスト名",
      default: "localhost",
      env: "HOST",
      config: "server.host",
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

### args 定義の各フィールド

| フィールド    | 必須 | 説明                                                                    |
| ------------- | ---- | ----------------------------------------------------------------------- |
| `type`        | ✓    | Zod スキーマ。型変換とバリデーションを担う                              |
| `description` | ✓    | ヘルプに表示される説明文                                                |
| `alias`       |      | 短縮フラグ（`-p` 等）                                                   |
| `positional`  |      | `true` なら位置引数として扱う                                           |
| `default`     |      | デフォルト値                                                            |
| `env`         |      | 対応する環境変数名                                                      |
| `config`      |      | 対応する設定ファイルのキーパス                                          |
| `multiple`    |      | `true` なら配列として受け取る（`--filter a --filter b` → `["a", "b"]`） |

## 値の解決フロー: Single Schema

1つの args 定義に対し、複数のソースから値を探索して優先順位でマージする。

```
CLI flag        --port 8080           ← 最優先
                    ↓ なければ
env             PORT=5000
                    ↓ なければ
config file     [server]
                port = 4000           （config.toml 等）
                    ↓ なければ
default         3000
                    ↓
                z.coerce.number().min(1).max(65535).parse(解決された値)
                    ↓
                args.port: number     型付きの値がハンドラに届く
```

どのソースから来た値も、最終的に同じ Zod スキーマでバリデーションされる。`z.coerce` により、環境変数の文字列 `"5000"` も自動的に `number` に変換される。

### ヘルプ自動生成

args 定義からヘルプを自動生成する。

```
$ my-app serve --help

サーバーを起動する

Usage: my-app serve [options]

Options:
  -p, --port <port>  ポート番号 (env: PORT, default: 3000)
      --host <host>  ホスト名 (env: HOST, default: localhost)
  -v, --verbose      詳細ログ
  -h, --help         ヘルプを表示する
```

## アーキテクチャ

```
process.argv / process.env / config file
    │              │              │
    ▼              ▼              ▼
┌──────────────────────────────────────┐
│            エントリポイント              │
│  argv をルーターへ、env/config を保持    │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────┐
│ ルーター   │  commands/ を走査してファイル特定
│          │  動的セグメント [param] を params に収集
│          │  残りトークンをパーサーへ渡す
└────┬─────┘
     │  コマンドファイル + 残りトークン + params
     ▼
┌──────────┐
│ パーサー   │  残りトークンを分類
│          │  --flag, -f, 位置引数, -- 以降の扱い
└────┬─────┘
     │  分類されたトークン
     ▼
┌──────────┐
│ リゾルバー │  args 定義の各フィールドを優先順位で解決
│          │  CLI flag > env > config > default
└────┬─────┘
     │  マージ済みの生の値
     ▼
┌──────────┐
│ Zod      │  z.object({...}).parse() で型変換 + バリデーション
└────┬─────┘
     │  型付きの args オブジェクト
     ▼
┌──────────┐
│ ハンドラ   │  run({ params, args }) を実行
└──────────┘
```

### フレームワーク内部のモジュール構成

| モジュール  | 責務                                                                             | Web で言うと                       |
| ----------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| `router`    | `commands/` を走査してコマンドファイルを特定。動的セグメントから `params` を抽出 | ファイルシステムルーター           |
| `parser`    | 残りトークンを `--flag` / `-f` / 位置引数に分類                                  | `URLSearchParams` のパース         |
| `resolver`  | CLI flag > env > config > default の優先順位で値を解決                           | ミドルウェアでのリクエスト組み立て |
| `validator` | Zod スキーマで型変換 + バリデーション                                            | リクエストバリデーション層         |
| `help`      | args 定義からヘルプ文字列を生成                                                  | OpenAPI / Swagger 生成             |
| `config`    | 設定ファイル（TOML/JSON/YAML）の読み込み                                         | `.env` + config 読み込み           |
| `types`     | `defineCommand` の型定義。Zod スキーマからハンドラ引数の型を推論                 | route handler の型定義             |

## 既存ツールとの比較

### 機能比較

| 機能                            | fsss | commander | oclif  | Pastel              | Gud CLI | convict         |
| ------------------------------- | ---- | --------- | ------ | ------------------- | ------- | --------------- |
| ファイルベースルーティング      | ✓    | ✗         | ✓      | ✓                   | ✓       | —               |
| 動的セグメント `[param]`        | ✓    | ✗         | ✗      | ✗                   | ✓       | —               |
| Zod スキーマで引数定義          | ✓    | ✗         | ✗      | ✓                   | ✗       | ✗               |
| 環境変数の統合                  | ✓    | ✗         | ✗      | ✗                   | ✗       | ✓               |
| 設定ファイルの統合              | ✓    | ✗         | ✗      | ✗                   | ✗       | ✓               |
| 1スキーマで CLI/env/config 統合 | ✓    | ✗         | ✗      | ✗                   | ✗       | ✗（Zod 非対応） |
| params/args 分離                | ✓    | ✗         | ✗      | ✗                   | ✓       | —               |
| ヘルプ自動生成                  | ✓    | ✓         | ✓      | ✓（commander 委譲） | ✗       | ✗               |
| 型推論（defineCommand）         | ✓    | ✗         | 部分的 | ✗（手動 z.infer）   | 部分的  | ✗               |
| bun ネイティブ                  | ✓    | ✗         | ✗      | ✗                   | ✗       | ✗               |

### 実装比較

| 観点           | fsss                   | oclif                | Pastel                   | Gud CLI                |
| -------------- | ---------------------- | -------------------- | ------------------------ | ---------------------- |
| コマンド発見   | `fs.readdir` 逐次      | `tinyglobby` glob    | `fs.readdir` 再帰        | `readdirSync` 逐次     |
| データ構造     | 構築しない（逐次解決） | フラット Map         | 再帰 Map ツリー          | 構築しない（逐次解決） |
| 引数パース     | 自前 or 軽量ライブラリ | 完全自前             | commander 委譲           | yargs-parser           |
| バリデーション | Zod（1段階）           | 自前                 | commander + Zod（2段階） | yargs-parser のみ      |
| 遅延ロード     | 逐次 import            | manifest + lazy load | なし（全ロード）         | 逐次 import            |
| ランタイム依存 | zod のみ               | なし                 | React + Ink + commander  | yargs-parser           |

### 各ツールの位置づけと fsss が埋めるギャップ

- **commander / yargs** — 手動でコマンドを登録する古典的な方式。ファイルベースルーティングなし
- **oclif** — ファイルベースルーティングはあるが、env/config 統合なし。クラスベースで重厚
- **Pastel** — Zod スキーマを採用しているが、React/Ink 必須。env/config 統合なし。`.describe()` に JSON を詰め込むハックがある
- **Gud CLI** — ファイルベースルーティング + 動的セグメント + params/args 分離を実現しているが、Zod 非対応、env/config 統合なし
- **convict** — CLI/env/config の統合はあるが、独自スキーマ形式で Zod 非対応。ファイルベースルーティングなし

**fsss が目指すもの:** Gud CLI のルーティング設計（ファイルベース + 動的セグメント + params/args 分離）と、convict の設定統合思想（1スキーマで CLI/env/config を統一）を、Zod スキーマと bun の上で組み合わせる。どのツールも単独では持っていない「ファイルベースルーティング + Zod + CLI/env/config 統合」の3つを1つのフレームワークで提供する。

### Web フレームワークとの対比

fsss の設計は Web フレームワークのメンタルモデルを CLI に持ち込んでいる。

| Web                            | fsss                           |
| ------------------------------ | ------------------------------ |
| `app/user/delete/route.ts`     | `commands/user/delete.ts`      |
| `app/user/[id]/route.ts`       | `commands/user/[id]/status.ts` |
| `req.params`（パスパラメータ） | `params`（動的セグメント由来） |
| `req.query`（クエリ文字列）    | `args`（CLI フラグ・位置引数） |
| `process.env`                  | `env`（環境変数）              |
| `.env` + config                | 設定ファイル（TOML/JSON/YAML） |
| Zod でリクエストバリデーション | Zod で引数バリデーション       |
| OpenAPI / Swagger              | `--help` 自動生成              |
