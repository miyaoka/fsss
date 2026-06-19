import { array, type BaseSchema, object, parse } from "@tskm/core";
import type { ArgsDefs } from "./types";
import { isBooleanSchema, isNumberSchema } from "./schema-utils";

// CLI フラグ・環境変数は文字列で入ってくる。tskm には z.coerce / z.preprocess 相当が
// 無いため、parse に渡す前にフレームワーク側で文字列→適切な型へ変換する。
// 文字列以外（config ファイルの値・default 値）はそのまま通す。

function coerceValue(schema: BaseSchema<unknown, unknown>, value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  if (isBooleanSchema(schema)) {
    return value === "true" || value === "1";
  }
  if (isNumberSchema(schema)) {
    return Number(value);
  }
  // string やその他のスキーマはそのまま
  return value;
}

function validateArgs(
  argsDefs: ArgsDefs,
  rawValues: Record<string, unknown>,
): Record<string, unknown> {
  // arg 定義の type フィールドから object スキーマを動的構築する。
  // 各値は事前に文字列→型変換してから parse に渡す。
  const shape: Record<string, BaseSchema<unknown, unknown>> = {};
  const values: Record<string, unknown> = {};

  for (const [name, def] of Object.entries(argsDefs)) {
    const present = name in rawValues;

    if (def.multiple === true) {
      shape[name] = array(def.type);
      if (present) {
        const raw = rawValues[name];
        values[name] = Array.isArray(raw) ? raw.map((v) => coerceValue(def.type, v)) : raw;
      }
      continue;
    }

    shape[name] = def.type;
    if (present) {
      values[name] = coerceValue(def.type, rawValues[name]);
    }
  }

  return parse(object(shape), values) as Record<string, unknown>;
}

export { validateArgs };
