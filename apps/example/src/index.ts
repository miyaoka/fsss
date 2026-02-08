#!/usr/bin/env bun

import { join } from "node:path";
import { createCLI } from "@miyaoka/fsss";
import loggerPlugin from "./plugins/logger";

const cli = createCLI({
  // CLI 名（必須）。ヘルプの Usage 表示と config ファイル名に使われる
  name: "fsss-example",
  // commands/ ディレクトリのパス（デフォルト: "commands"）
  commandsDir: join(import.meta.dirname, "commands"),
  // 自動 env マッピング。指定すると EXAMPLE_SERVE_PORT のように prefix 付きで自動導出される
  autoEnv: { prefix: "EXAMPLE" },
  // プラグイン
  plugins: [loggerPlugin],
});
await cli.run();
