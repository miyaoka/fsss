import type { BaseSchema } from "@tskm/core";

// パーサー / バリデーターがフラグの型を判定するのに使う。
// tskm スキーマは判別子 `type` を持つ plain object（{ kind:"schema", type:"boolean", ... }）。
// pipe(number(), ...) は ...schema を spread するため、pipe 後も `type` が保持される。

function isBooleanSchema(schema: BaseSchema<unknown, unknown>): boolean {
  return schema.type === "boolean";
}

function isNumberSchema(schema: BaseSchema<unknown, unknown>): boolean {
  return schema.type === "number";
}

export { isBooleanSchema, isNumberSchema };
