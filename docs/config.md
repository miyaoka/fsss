# 設定ファイルと環境変数

## autoEnv — 環境変数の自動マッピング

`createCLI` に `autoEnv` を指定すると、コマンドパス + arg 名から環境変数名を自動導出する。

```ts
const cli = createCLI({
  name: "my-app",
  autoEnv: { prefix: "MYAPP" },
});
```

### 導出ルール

`{PREFIX}_{COMMAND_PATH}_{ARG_NAME}` を大文字アンダースコアで結合する。動的セグメント `[name]` はスキップされる。

| コマンド       | arg     | 自動導出                  |
| -------------- | ------- | ------------------------- |
| `serve`        | `port`  | `MYAPP_SERVE_PORT`        |
| `remote push`  | `force` | `MYAPP_REMOTE_PUSH_FORCE` |
| ルートコマンド | `port`  | `MYAPP_PORT`              |

### 明示指定との関係

- `autoEnv` 未指定 → 自動導出しない。明示 `env: "PORT"` のみ有効
- `autoEnv` 指定あり + `env` フィールド未指定 → 自動導出
- `autoEnv` 指定あり + `env: "PORT"` → 明示指定が優先（prefix は付かない）

> [!NOTE]
> `autoEnv` を指定しない場合でも、個別の arg に `env: "PORT"` を書けば環境変数は使える。`autoEnv` は「全 arg に一括で env マッピングを有効にする」機能。

## config ファイル — 設定ファイルの自動マッピング

config ファイルの JSON 構造はコマンドツリーと一致する。この対応は `autoEnv` とは独立して常に有効。

### 導出ルール

コマンドパス + arg 名をドットで結合する。

| コマンド      | arg     | config パス         |
| ------------- | ------- | ------------------- |
| `serve`       | `port`  | `serve.port`        |
| `remote push` | `force` | `remote.push.force` |

対応する config ファイルの構造:

```json
{
  "serve": { "port": 5000, "host": "0.0.0.0" },
  "remote": { "push": { "force": true } }
}
```

個別の arg に `config: "custom.key"` を書くと自動導出を上書きできる。

## config ファイル階層

優先順位（低→高）:

- ユーザーレベル: `~/.config/<name>/config.json`
- プロジェクトレベル: `./<name>.config.json`（cwd）
- CLI 指定: `--config path.json` / `-c path.json`

複数のファイルが存在する場合、低い優先順位から順に deep merge される。ネストオブジェクトは再帰マージ、プリミティブは後勝ち。

## `--config` フラグ

Docker / Git / Cargo と同じパターンで、グローバルフラグをサブコマンドの**前**に配置する。

```
my-app --config path.json serve --port 8080
my-app -c path.json serve --port 8080
```

フレームワークフラグはルーティング前に消費されるため、コマンド側のフラグ定義と衝突しない。

## createCLI オプション

```ts
const cli = createCLI({
  // CLI 名（必須）。ヘルプの Usage 表示と config ファイル名に使われる
  name: "my-app",
  // commands/ ディレクトリのパス（デフォルト: "commands"）
  commandsDir: join(import.meta.dirname, "commands"),
  // 自動 env マッピング。指定すると prefix 付きで自動導出される
  autoEnv: { prefix: "MYAPP" },
});
```

| フィールド    | 必須 | 説明                                                           |
| ------------- | ---- | -------------------------------------------------------------- |
| `name`        | ✓    | CLI 名。ヘルプの Usage 行と config ファイル名に使われる        |
| `commandsDir` |      | コマンドファイルのディレクトリパス（デフォルト: `"commands"`） |
| `autoEnv`     |      | `{ prefix: string }` を指定すると自動 env マッピングが有効     |
