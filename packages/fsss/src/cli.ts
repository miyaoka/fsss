import { basename, relative, resolve } from "node:path";
import { loadConfig } from "./config";
import { generateHelp } from "./help";
import { parseTokens } from "./parser";
import type { ParserConfig } from "./parser";
import { resolveValues } from "./resolver";
import { resolveRoute } from "./router";
import type { ArgsDefs, CommandConfig } from "./types";
import { validateArgs } from "./validator";
import { isBooleanSchema } from "./zod-utils";

interface CLIOptions {
  commandsDir?: string;
  name?: string;
  configPath?: string;
}

interface CLI {
  run: () => Promise<void>;
}

const DEFAULT_COMMANDS_DIR = "commands";
const ARGV_SKIP = 2;

// arg 定義からパーサー設定を構築する
function buildParserConfig(argsDefs: ArgsDefs): ParserConfig {
  const booleanFlags = new Set<string>();
  const aliases = new Map<string, string>();

  for (const [name, def] of Object.entries(argsDefs)) {
    if (isBooleanSchema(def.type)) {
      booleanFlags.add(name);
    }
    if (def.alias !== undefined) {
      aliases.set(def.alias, name);
    }
  }

  return { booleanFlags, aliases };
}

// コマンドファイルパスからコマンドパス（help 表示用）を抽出する
function extractCommandPath(commandsDir: string, filePath: string): string[] {
  const relPath = relative(resolve(commandsDir), filePath);
  // "serve.ts" → ["serve"], "config/set.ts" → ["config", "set"]
  const withoutExt = relPath.replace(/\.ts$/, "");
  const segments = withoutExt.split("/");
  // index はルートコマンドなので除外
  return segments.filter((s) => s !== "index");
}

function createCLI(options?: CLIOptions): CLI {
  const commandsDir = options?.commandsDir ?? DEFAULT_COMMANDS_DIR;
  const programName = options?.name ?? basename(process.argv[1] ?? "cli");
  const configPath = options?.configPath;

  async function run(): Promise<void> {
    const tokens = process.argv.slice(ARGV_SKIP);

    // ルーティング
    const routeResult = await resolveRoute(commandsDir, tokens);

    // コマンドファイルの動的 import
    const commandModule = await import(routeResult.filePath);
    const commandConfig: CommandConfig = commandModule.default;

    const argsDefs = commandConfig.args ?? {};

    // --help / -h チェック
    if (
      routeResult.remainingTokens.includes("--help") ||
      routeResult.remainingTokens.includes("-h")
    ) {
      const commandPath = extractCommandPath(commandsDir, routeResult.filePath);
      const helpText = generateHelp({
        programName,
        commandPath,
        description: commandConfig.description,
        argsDefs: Object.keys(argsDefs).length > 0 ? argsDefs : undefined,
      });
      console.log(helpText);
      return;
    }

    // パーサー設定の構築
    const parserConfig = buildParserConfig(argsDefs);

    // トークンパース
    const parsedTokens = parseTokens(routeResult.remainingTokens, parserConfig);

    // 設定ファイル読み込み
    const config = configPath !== undefined ? await loadConfig(configPath) : undefined;

    // 値の解決
    const rawValues = resolveValues({
      argsDefs,
      parsedTokens,
      env: process.env,
      config,
    });

    // バリデーション
    const args = validateArgs(argsDefs, rawValues);

    // ハンドラ実行
    await commandConfig.run({
      params: routeResult.params,
      args,
    });
  }

  return { run };
}

export { createCLI };
export type { CLI, CLIOptions };
