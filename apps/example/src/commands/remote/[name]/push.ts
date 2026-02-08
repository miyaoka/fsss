import { defineCommand } from "fsss";
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
    console.log(`Pushing ${args.branch} to ${params.name}`);
    if (args.force) {
      console.log("Force push enabled");
    }
  },
});
