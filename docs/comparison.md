# 既存ツールとの比較

## 機能比較

| 機能                            | fsss | commander | oclif  | Pastel              | Gud CLI | gunshi                | convict         |
| ------------------------------- | ---- | --------- | ------ | ------------------- | ------- | --------------------- | --------------- |
| ファイルベースルーティング      | ✓    | ✗         | ✓      | ✓                   | ✓       | ✗                     | —               |
| 動的セグメント `[param]`        | ✓    | ✗         | ✗      | ✗                   | ✓       | ✗                     | —               |
| Zod スキーマで引数定義          | ✓    | ✗         | ✗      | ✓                   | ✗       | ✗                     | ✗               |
| 環境変数の統合                  | ✓    | ✗         | ✗      | ✗                   | ✗       | ✗                     | ✓               |
| 設定ファイルの統合              | ✓    | ✗         | ✗      | ✗                   | ✗       | ✗                     | ✓               |
| 1スキーマで CLI/env/config 統合 | ✓    | ✗         | ✗      | ✗                   | ✗       | ✗                     | ✗（Zod 非対応） |
| params/args 分離                | ✓    | ✗         | ✗      | ✗                   | ✓       | ✗                     | —               |
| ヘルプ自動生成                  | ✓    | ✓         | ✓      | ✓（commander 委譲） | ✗       | ✓                     | ✗               |
| プラグイン / ミドルウェア       | ✓    | ✗         | ✓      | ✗                   | ✓       | ✓                     | ✗               |
| 型推論（defineCommand）         | ✓    | ✗         | 部分的 | ✗（手動 z.infer）   | 部分的  | ✓（defineWithTypes）  | ✗               |
| bun ネイティブ                  | ✓    | ✗         | ✗      | ✗                   | ✗       | ✓（マルチランタイム） | ✗               |

## 実装比較

| 観点           | fsss                   | oclif                | Pastel                   | Gud CLI                | gunshi                |
| -------------- | ---------------------- | -------------------- | ------------------------ | ---------------------- | --------------------- |
| コマンド発見   | `fs.readdir` 逐次      | `tinyglobby` glob    | `fs.readdir` 再帰        | `readdirSync` 逐次     | `subCommands` マップ  |
| データ構造     | 構築しない（逐次解決） | フラット Map         | 再帰 Map ツリー          | 構築しない（逐次解決） | 手動定義マップ        |
| 引数パース     | 自前                   | 完全自前             | commander 委譲           | yargs-parser           | args-tokens           |
| バリデーション | Zod（1段階）           | 自前                 | commander + Zod（2段階） | yargs-parser のみ      | args-tokens           |
| 遅延ロード     | 逐次 import            | manifest + lazy load | なし（全ロード）         | 逐次 import            | lazy（lazyWithTypes） |
| ランタイム依存 | zod のみ               | なし                 | React + Ink + commander  | yargs-parser           | args-tokens のみ      |

## 各ツールの位置づけ

- **commander / yargs** — 手動でコマンドを登録する古典的な方式。ファイルベースルーティングなし
- **oclif** — ファイルベースルーティングはあるが、env/config 統合なし。クラスベースで重厚
- **Pastel** — Zod スキーマを採用しているが、React/Ink 必須。env/config 統合なし。`.describe()` に JSON を詰め込むハックがある
- **Gud CLI** — ファイルベースルーティング + 動的セグメント + params/args 分離を実現しているが、Zod 非対応、env/config 統合なし
- **gunshi** — プラグインシステム + 型推論 + マルチランタイム対応。ファイルベースルーティングや env/config 統合はなく、引数定義は args-tokens ベース
- **convict** — CLI/env/config の統合はあるが、独自スキーマ形式で Zod 非対応。ファイルベースルーティングなし

**fsss が目指すもの:** Gud CLI のルーティング設計（ファイルベース + 動的セグメント + params/args 分離）と、convict の設定統合思想（1スキーマで CLI/env/config を統一）を、Zod スキーマと bun の上で組み合わせる。どのツールも単独では持っていない「ファイルベースルーティング + Zod + CLI/env/config 統合」の3つを1つのフレームワークで提供する。

## Web フレームワークとの対比

fsss の設計は Web フレームワークのメンタルモデルを CLI に持ち込んでいる。

| Web                            | fsss                           |
| ------------------------------ | ------------------------------ |
| `app/user/delete/route.ts`     | `commands/user/delete.ts`      |
| `app/user/[id]/route.ts`       | `commands/user/[id]/status.ts` |
| `req.params`（パスパラメータ） | `params`（動的セグメント由来） |
| `req.query`（クエリ文字列）    | `args`（CLI フラグ・位置引数） |
| `process.env`                  | `env`（環境変数）              |
| `.env` + config                | 設定ファイル（JSON）           |
| Zod でリクエストバリデーション | Zod で引数バリデーション       |
| ミドルウェア（Express / Koa）  | `_plugins/` の middleware      |
| OpenAPI / Swagger              | `--help` 自動生成              |
