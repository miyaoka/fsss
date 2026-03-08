import { defineCommand } from "../../../src/index";
import { z } from "zod";

export default defineCommand({
  description: "ファイルを開く",
  args: {
    path: {
      type: z.string(),
      positional: true,
      description: "対象パス",
      default: ".",
    },
  },
  run({ args }) {
    console.log(args.path);
  },
});
