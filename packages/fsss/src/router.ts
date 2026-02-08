import { readdir, stat } from "node:fs/promises";
import { join, resolve } from "node:path";

const DYNAMIC_SEGMENT_PATTERN = /^\[(.+)]$/;
const COMMAND_FILE_EXTENSION = ".ts";
const INDEX_FILE_NAME = "index";

interface RouteResult {
  filePath: string;
  params: Record<string, string>;
  remainingTokens: string[];
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.isFile();
  } catch {
    return false;
  }
}

async function resolveRoute(commandsDir: string, tokens: string[]): Promise<RouteResult> {
  let currentDir = resolve(commandsDir);
  const params: Record<string, string> = {};
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
        filePath: join(currentDir, fileMatch.name),
        params,
        remainingTokens: tokens.slice(consumedCount),
      };
    }

    // ディレクトリとして解決を試みる
    const dirMatch = entries.find((e) => e.isDirectory() && e.name === token);
    if (dirMatch) {
      currentDir = join(currentDir, dirMatch.name);
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
      filePath: indexPath,
      params,
      remainingTokens: tokens.slice(consumedCount),
    };
  }

  throw new Error(`Command not found: ${tokens.join(" ")}`);
}

export { resolveRoute };
export type { RouteResult };
