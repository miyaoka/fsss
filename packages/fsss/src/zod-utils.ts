import { ZodBoolean, ZodNumber, type ZodType } from "zod";

// パーサーが boolean フラグかどうかを判定するのに使う
// z.boolean() → ZodBoolean（instanceof で判定可能）
// z.coerce.boolean() → ZodBoolean（coerce: true 付きだが同じクラス）

function isBooleanSchema(schema: ZodType): boolean {
  return schema instanceof ZodBoolean;
}

// バリデーターが number スキーマかどうかを判定するのに使う
// z.number() → ZodNumber（instanceof で判定可能）
// z.coerce.number() → ZodNumber（coerce: true 付きだが同じクラス）

function isNumberSchema(schema: ZodType): boolean {
  return schema instanceof ZodNumber;
}

export { isBooleanSchema, isNumberSchema };
