import { relative, resolve } from "node:path";
import { ZodError } from "zod";
import { loadMergedConfig } from "./config";
import {
  generateDefaultCommandHelp,
  generateHelp,
  generateSubcommandHelp,
  generateValidationErrorHelp,
} from "./help";
import { parseTokens } from "./parser";
import type { ParserConfig } from "./parser";
import { buildMiddlewareChain, scanPluginsAlongPath } from "./plugin";
import { resolveValues } from "./resolver";
import { resolveRoute } from "./router";
import type { ArgsDefs, CommandConfig, MiddlewareContext } from "./types";
import { validateArgs } from "./validator";
import { isBooleanSchema } from "./zod-utils";

interface AutoEnvConfig {
  prefix: string;
}

interface VersionConfig {
  number: string;
  alias?: string | false;
}

interface CLIOptions {
  name: string;
  commandsDir?: string;
  autoEnv?: AutoEnvConfig;
  defaultCommand?: string;
  version?: string | VersionConfig;
}

interface CLI {
  run: () => Promise<void>;
}

const DEFAULT_COMMANDS_DIR = "commands";
const ARGV_SKIP = 2;
const EXIT_CODE_ERROR = 1;
const DEFAULT_VERSION_ALIAS = "V";

// version オプションからバージョン文字列とエイリアスを解決する
interface ResolvedVersion {
  number: string;
  alias: string | undefined;
}

function resolveVersion(version: string | VersionConfig): ResolvedVersion {
  if (typeof version === "string") {
    return { number: version, alias: DEFAULT_VERSION_ALIAS };
  }
  return {
    number: version.number,
    alias: version.alias === false ? undefined : (version.alias ?? DEFAULT_VERSION_ALIAS),
  };
}

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
// 動的セグメント [name] はフィルタする
function extractCommandPath(commandsDir: string, filePath: string): string[] {
  const relPath = relative(resolve(commandsDir), filePath);
  const withoutExt = relPath.replace(/\.ts$/, "");
  const segments = withoutExt.split("/");
  return segments.filter((s) => s !== "index" && !s.startsWith("["));
}

// ルート未解決時の入力済みコマンドパスを抽出する
function extractPartialCommandPath(commandsDir: string, stoppedDir: string): string[] {
  const relPath = relative(resolve(commandsDir), stoppedDir);
  if (relPath === "" || relPath === ".") {
    return [];
  }
  const segments = relPath.split("/");
  return segments.filter((s) => !s.startsWith("["));
}

// argv からフレームワークフラグ（--config / -c / --version）を抽出する
// サブコマンドの前に配置されるグローバルフラグを処理する
// 残りのトークンは router に渡される
interface FrameworkFlagsConfig {
  versionAlias: string | undefined;
}

interface FrameworkFlags {
  configPath: string | undefined;
  showVersion: boolean;
  remainingTokens: string[];
}

function extractFrameworkFlags(tokens: string[], config: FrameworkFlagsConfig): FrameworkFlags {
  let configPath: string | undefined;
  let showVersion = false;
  const remaining: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // --config=path.json
    if (token.startsWith("--config=")) {
      configPath = token.slice("--config=".length);
      continue;
    }

    // --config path.json / -c path.json
    if (token === "--config" || token === "-c") {
      const nextToken = tokens[i + 1];
      if (nextToken === undefined) {
        throw new Error("--config requires a file path");
      }
      configPath = nextToken;
      i++;
      continue;
    }

    // --version / -V（エイリアス）
    if (
      token === "--version" ||
      (config.versionAlias !== undefined && token === `-${config.versionAlias}`)
    ) {
      showVersion = true;
      continue;
    }

    remaining.push(token);
  }

  return { configPath, showVersion, remainingTokens: remaining };
}

function createCLI(options: CLIOptions): CLI {
  const commandsDir = options.commandsDir ?? DEFAULT_COMMANDS_DIR;
  const programName = options.name;
  const envPrefix = options.autoEnv?.prefix;
  const defaultCommand = options.defaultCommand;
  const resolvedVersion =
    options.version !== undefined ? resolveVersion(options.version) : undefined;

  async function run(): Promise<void> {
    const rawTokens = process.argv.slice(ARGV_SKIP);

    // フレームワークフラグの抽出（--config / -c / --version）
    const {
      configPath,
      showVersion,
      remainingTokens: tokens,
    } = extractFrameworkFlags(rawTokens, {
      versionAlias: resolvedVersion?.alias,
    });

    // --version チェック（version 指定時のみ有効）
    if (showVersion && resolvedVersion !== undefined) {
      console.log(resolvedVersion.number);
      return;
    }

    // ルーティング
    let routeResult = await resolveRoute(commandsDir, tokens);

    // ルート未解決時の処理
    if (routeResult.kind === "unresolved") {
      const isRootLevel = resolve(routeResult.stoppedDir) === resolve(commandsDir);

      if (isRootLevel && defaultCommand !== undefined) {
        // --help / -h → サブコマンド一覧 + デフォルトコマンドの Options を統合表示
        if (tokens.includes("--help") || tokens.includes("-h")) {
          const defaultRouteResult = await resolveRoute(commandsDir, [defaultCommand]);
          if (defaultRouteResult.kind === "unresolved") {
            throw new Error(`defaultCommand "${defaultCommand}" does not match any command file`);
          }
          const commandModule = await import(defaultRouteResult.filePath);
          const commandConfig: CommandConfig = commandModule.default;
          const argsDefs = commandConfig.args ?? {};
          const commandPath = extractCommandPath(commandsDir, defaultRouteResult.filePath);
          const helpText = generateDefaultCommandHelp({
            programName,
            defaultCommandName: defaultCommand,
            commandPath,
            description: commandConfig.description,
            argsDefs: Object.keys(argsDefs).length > 0 ? argsDefs : undefined,
            envPrefix,
            showVersion: resolvedVersion !== undefined,
            versionAlias: resolvedVersion?.alias,
            availableEntries: routeResult.availableEntries,
          });
          console.log(helpText);
          return;
        }

        // デフォルトコマンドのトークンを先頭に挿入して再解決
        const retryResult = await resolveRoute(commandsDir, [defaultCommand, ...tokens]);
        if (retryResult.kind === "unresolved") {
          throw new Error(`defaultCommand "${defaultCommand}" does not match any command file`);
        }
        routeResult = retryResult;
      } else {
        // defaultCommand なし or root 以外 → サブコマンド一覧ヘルプを表示
        const commandPath = extractPartialCommandPath(commandsDir, routeResult.stoppedDir);
        const helpText = generateSubcommandHelp({
          programName,
          commandPath,
          availableEntries: routeResult.availableEntries,
        });
        console.log(helpText);
        return;
      }
    }

    // コマンドファイルの動的 import
    const commandModule = await import(routeResult.filePath);
    const commandConfig: CommandConfig = commandModule.default;

    const argsDefs = commandConfig.args ?? {};

    // ヘルプ生成（--help 表示・エラー表示で共通）
    const commandPath = extractCommandPath(commandsDir, routeResult.filePath);
    const helpText = generateHelp({
      programName,
      commandPath,
      description: commandConfig.description,
      argsDefs: Object.keys(argsDefs).length > 0 ? argsDefs : undefined,
      envPrefix,
      showVersion: resolvedVersion !== undefined,
      versionAlias: resolvedVersion?.alias,
    });

    // --help / -h チェック
    if (
      routeResult.remainingTokens.includes("--help") ||
      routeResult.remainingTokens.includes("-h")
    ) {
      console.log(helpText);
      return;
    }

    // パーサー設定の構築
    const parserConfig = buildParserConfig(argsDefs);

    // パース → 解決 → バリデーション（失敗時はヘルプを表示）
    let args: Record<string, unknown>;
    try {
      const parsedTokens = parseTokens(routeResult.remainingTokens, parserConfig);
      const config = await loadMergedConfig(programName, configPath);
      const rawValues = resolveValues({
        argsDefs,
        parsedTokens,
        env: process.env,
        config,
        commandPath,
        envPrefix,
      });
      args = validateArgs(argsDefs, rawValues);
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        );
        console.error(generateValidationErrorHelp(helpText, errorMessages));
        process.exit(EXIT_CODE_ERROR);
      }
      if (error instanceof Error) {
        console.error(generateValidationErrorHelp(helpText, [error.message]));
        process.exit(EXIT_CODE_ERROR);
      }
      throw error;
    }

    // プラグイン解決（commandsDir → コマンドファイルまでの各階層で _plugins/ をスキャン）
    const { extensions, middlewares } = await scanPluginsAlongPath(routeResult.traversedDirs, {
      cliName: programName,
    });

    // ミドルウェアチェーン構築 → ハンドラ実行
    const middlewareContext: MiddlewareContext = {
      commandPath,
      params: routeResult.params,
      args,
      extensions,
    };

    const handler = buildMiddlewareChain(middlewares, async (ctx) => {
      await commandConfig.run({
        params: ctx.params,
        args: ctx.args,
        extensions: ctx.extensions,
      });
    });

    await handler(middlewareContext);
  }

  return { run };
}

export { createCLI };
export type { CLI, CLIOptions, VersionConfig };
