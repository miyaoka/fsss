import { z } from "zod";
import type { ArgsDefs } from "./types";
import { isBooleanSchema, isNumberSchema } from "./zod-utils";

// CLI フラグ・環境変数は文字列で入ってくるため、
// Zod スキーマに渡す前にフレームワーク側で型変換する。
// z.preprocess() でスキーマをラップし、文字列→適切な型への変換を行う。
// @julr/vite-plugin-validate-env と同じアプローチ。

function wrapWithStringPreprocess(schema: z.ZodType): z.ZodType {
  if (isBooleanSchema(schema)) {
    return z.preprocess((value) => {
      if (typeof value !== "string") {
        return value;
      }
      return value === "true" || value === "1";
    }, schema);
  }

  if (isNumberSchema(schema)) {
    return z.preprocess((value) => {
      if (typeof value !== "string") {
        return value;
      }
      return Number(value);
    }, schema);
  }

  // string やその他のスキーマはそのまま
  return schema;
}

function validateArgs(
  argsDefs: ArgsDefs,
  rawValues: Record<string, unknown>,
): Record<string, unknown> {
  // arg 定義の type フィールドから z.object() を動的構築
  // 各スキーマを z.preprocess() でラップして文字列→型変換を自動化
  const shape: Record<string, z.ZodType> = {};

  for (const [name, def] of Object.entries(argsDefs)) {
    const wrapped = wrapWithStringPreprocess(def.type);
    if (def.multiple === true) {
      shape[name] = z.array(wrapped);
      continue;
    }
    shape[name] = wrapped;
  }

  const schema = z.object(shape);
  return schema.parse(rawValues);
}

export { validateArgs };
