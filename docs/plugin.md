# プラグインシステム

コマンドに横断的な処理（ロギング、認証、計測等）を追加する仕組み。`commands/` ディレクトリ内に `_plugins/` ディレクトリを配置するだけで自動的に登録される。

## `_plugins/` ディレクトリ規約

`commands/` ツリーの任意の階層に `_plugins/` ディレクトリを置くと、その階層以下のコマンドにプラグインが適用される。

```
commands/
  _plugins/
    logger.ts          ← 全コマンドに適用
  serve.ts
  remote/
    _plugins/
      auth.ts          ← remote 配下にのみ適用
    [name]/
      push.ts
```

| コマンド             | 適用されるプラグイン |
| -------------------- | -------------------- |
| `serve`              | logger               |
| `remote origin push` | logger, auth         |

- `_` prefix のディレクトリはルーティング対象外。ヘルプにも表示されない
- 同一ディレクトリ内のプラグインはファイル名のアルファベット順で適用される
- root（`commands/`）に近いプラグインが外側、leaf に近いプラグインが内側になる

## プラグインの書き方

`definePlugin` で定義し、default export する。

```typescript
import { definePlugin } from "@miyaoka/fsss";

export interface LoggerExtensions {
  logger: {
    info: (message: string) => void;
  };
}

export default definePlugin(({ cliName }) => ({
  provide: {
    logger: {
      info: (msg: string) => console.log(`[${cliName}] ${msg}`),
    },
  },
  middleware: async (_ctx, next) => {
    const start = performance.now();
    await next();
    console.log(`${(performance.now() - start).toFixed(0)}ms`);
  },
}));
```

### `provide`

コマンドの `run()` で `extensions` として受け取れる値を提供する。

```typescript
run({ extensions }) {
  extensions.logger.info("hello");
}
```

### `middleware`

コマンドのハンドラ実行を包む関数。`next()` の前後に処理を挟める（onion model）。

```
logger(before) → auth(before) → handler → auth(after) → logger(after)
```

### `PluginContext`

`definePlugin` のコールバックが受け取るコンテキスト。

| フィールド | 型       | 説明                        |
| ---------- | -------- | --------------------------- |
| `cliName`  | `string` | `createCLI` に渡された name |

## Extensions の型生成

プラグインが `provide` する値の型は、`fsss-codegen` コマンドで自動生成する。

```bash
fsss-codegen --commandsDir src/commands --outDir src
```

### 仕組み

- `_plugins/` を再帰走査し、各ファイルの `export interface` を抽出する
- `declare module "@miyaoka/fsss"` で `Extensions` interface を拡張する `.d.ts` を生成する
- 型定義の実体はプラグインファイルに留まる（SSOT）

### 生成されるファイルの例

```typescript
// src/extensions.d.ts（自動生成）
import type { LoggerExtensions } from "./commands/_plugins/logger";
import type { AuthExtensions } from "./commands/remote/_plugins/auth";

declare module "@miyaoka/fsss" {
  interface Extensions extends LoggerExtensions, AuthExtensions {}
}
```

### 再実行が必要なタイミング

- `_plugins/` にファイルを追加・削除した
- `export interface` の名前を変更した

実装の変更（provide の値、middleware のロジック、interface 内のプロパティの型変更）では再実行不要。
