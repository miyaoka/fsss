import { defineCommand } from "../../../../src/index";
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
    console.log(args.key);
  },
});
