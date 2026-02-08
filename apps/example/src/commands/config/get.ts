import { defineCommand } from "fsss";
import { z } from "zod";

export default defineCommand({
  description: "設定値を取得する",
  args: {
    key: {
      type: z.string(),
      description: "設定キー",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`Getting value for: ${args.key}`);
  },
});
