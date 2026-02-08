import { readFile } from "node:fs/promises";

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

export { getByDotPath, loadConfig };
