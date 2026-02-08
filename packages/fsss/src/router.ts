import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const DYNAMIC_SEGMENT_PATTERN = /^\[(.+)]$/;
const COMMAND_FILE_EXTENSION = ".ts";
const INDEX_FILE_NAME = "index";
const INTERNAL_PREFIX = "_";

interface RouteResolved {
  kind: "resolved";
  filePath: string;
  params: Record<string, string>;
  remainingTokens: string[];
  traversedDirs: string[];
}

interface RouteUnresolved {
  kind: "unresolved";
  stoppedDir: string;
  availableEntries: AvailableEntry[];
}

interface AvailableEntry {
  name: string;
  isDynamic: boolean;
  paramName?: string;
}

type RouteResult = RouteResolved | RouteUnresolved;

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

// ディレクトリ内の利用可能なサブコマンド/サブディレクトリを列挙する
async function listAvailableEntries(dir: string): Promise<AvailableEntry[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const result: AvailableEntry[] = [];

    for (const entry of entries) {
      // _ prefix はフレームワーク内部用（_plugins 等）なのでスキップ
      if (entry.name.startsWith(INTERNAL_PREFIX)) {
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(COMMAND_FILE_EXTENSION)) {
        const name = entry.name.slice(0, -COMMAND_FILE_EXTENSION.length);
        // index はデフォルトコマンドなのでリストに表示しない
        if (name === INDEX_FILE_NAME) {
          continue;
        }
        result.push({ name, isDynamic: false });
        continue;
      }

      if (entry.isDirectory()) {
        const m = entry.name.match(DYNAMIC_SEGMENT_PATTERN);
        if (m !== null) {
          result.push({
            name: entry.name,
            isDynamic: true,
            paramName: m[1],
          });
          continue;
        }
        result.push({ name: entry.name, isDynamic: false });
      }
    }

    return result;
  } catch {
    return [];
  }
}

async function resolveRoute(commandsDir: string, tokens: string[]): Promise<RouteResult> {
  let currentDir = resolve(commandsDir);
  const params: Record<string, string> = {};
  const traversedDirs: string[] = [currentDir];
  let consumedCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // フラグ（- で始まる）に到達したらルーティング停止
    if (token.startsWith("-")) {
      break;
    }

    const entries = await readdir(currentDir, { withFileTypes: true });

    // ファイルとして解決を試みる（token.ts があるか）
    const fileName = token + COMMAND_FILE_EXTENSION;
    const fileMatch = entries.find((e) => e.isFile() && e.name === fileName);
    if (fileMatch) {
      consumedCount = i + 1;
      return {
        kind: "resolved",
        filePath: join(currentDir, fileMatch.name),
        params,
        remainingTokens: tokens.slice(consumedCount),
        traversedDirs,
      };
    }

    // ディレクトリとして解決を試みる
    const dirMatch = entries.find((e) => e.isDirectory() && e.name === token);
    if (dirMatch) {
      currentDir = join(currentDir, dirMatch.name);
      traversedDirs.push(currentDir);
      consumedCount = i + 1;
      continue;
    }

    // 動的セグメント [param] ディレクトリを探す
    let dynamicParamName: string | undefined;
    const dynamicMatch = entries.find((e) => {
      if (!e.isDirectory()) {
        return false;
      }
      const m = e.name.match(DYNAMIC_SEGMENT_PATTERN);
      if (m === null) {
        return false;
      }
      dynamicParamName = m[1];
      return true;
    });
    if (dynamicMatch && dynamicParamName !== undefined) {
      params[dynamicParamName] = token;
      currentDir = join(currentDir, dynamicMatch.name);
      traversedDirs.push(currentDir);
      consumedCount = i + 1;
      continue;
    }

    // どれにもマッチしなかった → ルーティング終了
    break;
  }

  // ループ終了後、currentDir に index.ts があるか確認
  const indexPath = join(currentDir, INDEX_FILE_NAME + COMMAND_FILE_EXTENSION);
  if (await fileExists(indexPath)) {
    return {
      kind: "resolved",
      filePath: indexPath,
      params,
      remainingTokens: tokens.slice(consumedCount),
      traversedDirs,
    };
  }

  // 未解決: 利用可能なサブコマンドを列挙して返す
  const availableEntries = await listAvailableEntries(currentDir);
  return {
    kind: "unresolved",
    stoppedDir: currentDir,
    availableEntries,
  };
}

export { resolveRoute };
export type { AvailableEntry, RouteResolved, RouteResult, RouteUnresolved };
