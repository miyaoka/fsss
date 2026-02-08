import { z } from "zod";
import type { ArgsDefs } from "./types";

function validateArgs(
  argsDefs: ArgsDefs,
  rawValues: Record<string, unknown>,
): Record<string, unknown> {
  // arg 定義の type フィールドから z.object() を動的構築
  const shape: Record<string, z.ZodType> = {};

  for (const [name, def] of Object.entries(argsDefs)) {
    if (def.multiple === true) {
      shape[name] = z.array(def.type);
      continue;
    }
    shape[name] = def.type;
  }

  const schema = z.object(shape);
  return schema.parse(rawValues);
}

export { validateArgs };
