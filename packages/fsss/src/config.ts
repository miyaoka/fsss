import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ドットパスで値を取得（"server.port" → obj.server.port）
function getByDotPath(obj: Record<string, unknown>, path: string): unknown {
  const segments = path.split(".");
  let current: unknown = obj;

  for (const segment of segments) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

// JSON ファイルを読み込む。ファイルが存在しなければ undefined を返す
async function loadConfig(filePath: string): Promise<Record<string, unknown> | undefined> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return undefined;
  }
}

// ネストオブジェクトの再帰マージ（後勝ち）
function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overrideValue] of Object.entries(override)) {
    const baseValue = result[key];
    if (isRecord(baseValue) && isRecord(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
      continue;
    }
    result[key] = overrideValue;
  }

  return result;
}

// config ファイルの候補パスを列挙する（優先順位: ユーザー < プロジェクト < CLI 指定）
function resolveConfigPaths(appName: string, cliConfigPath: string | undefined): string[] {
  const paths: string[] = [];

  // ユーザーレベル: ~/.config/<app-name>/config.json
  paths.push(join(homedir(), ".config", appName, "config.json"));

  // プロジェクトレベル: ./<app-name>.config.json（cwd）
  paths.push(join(process.cwd(), `${appName}.config.json`));

  // CLI 指定: --config path.json
  if (cliConfigPath !== undefined) {
    paths.push(cliConfigPath);
  }

  return paths;
}

// 複数の config ファイルを読み込み、優先順位に従ってマージする
async function loadMergedConfig(
  appName: string,
  cliConfigPath: string | undefined,
): Promise<Record<string, unknown> | undefined> {
  const paths = resolveConfigPaths(appName, cliConfigPath);
  let merged: Record<string, unknown> | undefined;

  for (const path of paths) {
    const config = await loadConfig(path);
    if (config === undefined) {
      continue;
    }
    if (merged === undefined) {
      merged = config;
      continue;
    }
    merged = deepMerge(merged, config);
  }

  return merged;
}

export { deepMerge, getByDotPath, loadConfig, loadMergedConfig, resolveConfigPaths };
