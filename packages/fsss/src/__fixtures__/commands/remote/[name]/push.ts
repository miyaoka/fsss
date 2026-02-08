import { defineCommand } from "../../../../index";
import { z } from "zod";

export default defineCommand({
  description: "リモートにプッシュする",
  args: {
    branch: {
      type: z.string(),
      description: "ブランチ名",
      positional: true,
    },
    force: {
      type: z.boolean(),
      description: "強制プッシュ",
      alias: "f",
      default: false,
    },
  },
  run({ params, args }) {
    console.log(`${params.name}:${args.branch}`);
    if (args.force) {
      console.log("force");
    }
  },
});
