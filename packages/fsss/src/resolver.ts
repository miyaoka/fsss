import { deriveConfigPath, deriveEnvName } from "./auto-mapping";
import { getByDotPath } from "./config";
import type { ParsedTokens } from "./parser";
import type { ArgsDefs } from "./types";

interface ResolverInput {
  argsDefs: ArgsDefs;
  parsedTokens: ParsedTokens;
  env: Record<string, string | undefined>;
  config: Record<string, unknown> | undefined;
  commandPath: string[];
  envPrefix: string | undefined;
}

// env 名を解決する
// 明示 env → そのまま / envPrefix あり → 自動導出 / どちらもなし → undefined
function resolveEnvName(
  explicitEnv: string | undefined,
  envPrefix: string | undefined,
  commandPath: string[],
  argName: string,
): string | undefined {
  if (explicitEnv !== undefined) {
    return explicitEnv;
  }
  if (envPrefix !== undefined) {
    return deriveEnvName(envPrefix, commandPath, argName);
  }
  return undefined;
}

function resolveValues(input: ResolverInput): Record<string, unknown> {
  const { argsDefs, parsedTokens, env, config, commandPath, envPrefix } = input;
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

    // 環境変数（明示指定 or 自動導出）
    const envName = resolveEnvName(def.env, envPrefix, commandPath, name);
    if (envName !== undefined) {
      const envValue = env[envName];
      if (envValue !== undefined) {
        result[name] = envValue;
        continue;
      }
    }

    // 設定ファイル（常に自動導出、明示指定で上書き可能）
    if (config !== undefined) {
      const configPath = def.config ?? deriveConfigPath(commandPath, name);
      const configValue = getByDotPath(config, configPath);
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
