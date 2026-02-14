# ファイルベースルーティング

## 基本

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

## 動的セグメント

ディレクトリ名に `[param]` を使うと、その位置の値が `params` として抽出される。

```
commands/
  remote/
    [name]/
      push.ts       # my-app remote origin push → params.name = "origin"
      status.ts     # my-app remote origin status
```

これは Web ルーティングの `/remote/:name/push` と同じ概念。コマンド解決の**途中**に変数が挟まるケースでのみ使う。末端の値は動的セグメントではなく引数（args）で受け取る。

## ルーターの動作

ルーターは `process.argv` のトークンを1つずつ消費しながら `commands/` ディレクトリを掘り進み、ファイルに当たったら止まる。

```
入力: ["user", "delete", "alice", "bob", "--force"]

"user"    → commands/user/       ディレクトリ発見。消費
"delete"  → commands/user/delete.ts  ファイル発見。消費
残り      → ["alice", "bob", "--force"] を引数パーサーへ
```

動的セグメントがある場合:

```
入力: ["remote", "origin", "push", "--force"]

"remote"  → commands/remote/         ディレクトリ発見。消費
"origin"  → commands/remote/[name]/  動的セグメント発見。消費。params = { name: "origin" }
"push"    → commands/remote/[name]/push.ts  ファイル発見。消費
残り      → ["--force"] を引数パーサーへ
```

ルーターが解決するのはコマンドファイルの特定まで。残りのトークンはパーサーとリゾルバーの仕事。

## デフォルトコマンド

`createCLI` の `defaultCommand` オプションで、引数なし・フラグのみの実行時にフォールバックするコマンドを指定できる。

```ts
const cli = createCLI({
  name: "my-app",
  commandsDir: join(import.meta.dirname, "commands"),
  defaultCommand: "serve",
});
```

```
my-app                → serve を実行（デフォルトコマンド）
my-app --port 8080    → serve --port 8080 として実行
my-app serve          → serve を直接実行（通常通り）
my-app build          → build を直接実行（影響なし）
my-app nonexistent    → サブコマンド一覧を表示（fallback しない）
```

`--help` 時はサブコマンド一覧 + デフォルトコマンドの Options を統合表示する。

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

> [!NOTE]
> `defaultCommand` は root レベル（`commands/` 直下）でのみ機能する。存在しないコマンド名を指定した場合は実行時にエラーになる。

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
