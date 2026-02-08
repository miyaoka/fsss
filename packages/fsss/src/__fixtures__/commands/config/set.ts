import { defineCommand } from "../../../index";
import { z } from "zod";

export default defineCommand({
  description: "設定値をセットする",
  args: {
    key: {
      type: z.string(),
      description: "設定キー",
      positional: true,
    },
    value: {
      type: z.string(),
      description: "設定値",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`${args.key}=${args.value}`);
  },
});
