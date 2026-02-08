import { getByDotPath } from "./config";
import type { ParsedTokens } from "./parser";
import type { ArgsDefs } from "./types";

interface ResolverInput {
  argsDefs: ArgsDefs;
  parsedTokens: ParsedTokens;
  env: Record<string, string | undefined>;
  config: Record<string, unknown> | undefined;
}

function resolveValues(input: ResolverInput): Record<string, unknown> {
  const { argsDefs, parsedTokens, env, config } = input;
  const result: Record<string, unknown> = {};
  let positionalIndex = 0;

  for (const [name, def] of Object.entries(argsDefs)) {
    // CLI flag（最優先）
    const flagValues = parsedTokens.flags.get(name);
    if (flagValues !== undefined) {
      if (def.multiple === true) {
        result[name] = flagValues;
        continue;
      }
      // 複数回指定された場合は最後の値を採用
      result[name] = flagValues[flagValues.length - 1];
      continue;
    }

    // 位置引数
    if (def.positional === true) {
      if (positionalIndex < parsedTokens.positionals.length) {
        result[name] = parsedTokens.positionals[positionalIndex];
        positionalIndex++;
        continue;
      }
    }

    // 環境変数
    if (def.env !== undefined) {
      const envValue = env[def.env];
      if (envValue !== undefined) {
        result[name] = envValue;
        continue;
      }
    }

    // 設定ファイル
    if (def.config !== undefined && config !== undefined) {
      const configValue = getByDotPath(config, def.config);
      if (configValue !== undefined) {
        result[name] = configValue;
        continue;
      }
    }

    // デフォルト値
    if ("default" in def) {
      result[name] = def.default;
      continue;
    }

    // どのソースからも値が見つからない → undefined のまま
    // Zod がバリデーションエラーにする
  }

  return result;
}

export { resolveValues };
export type { ResolverInput };
