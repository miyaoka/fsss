import { defineCommand } from "@miyaoka/fsss";
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
  run({ params, args, extensions }) {
    extensions.logger.info(
      `Pushing ${args.branch} to ${params.name} (token: ${extensions.auth.token})`,
    );
    if (args.force) {
      extensions.logger.info("Force push enabled");
    }
  },
});
