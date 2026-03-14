import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "Push to remote",
  args: {
    branch: {
      type: z.string(),
      description: "Branch name",
      positional: true,
    },
    force: {
      type: z.boolean(),
      description: "Force push",
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
