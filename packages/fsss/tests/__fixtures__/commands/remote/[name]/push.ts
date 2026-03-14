import { defineCommand } from "../../../../../src/index";
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
  run({ params, args }) {
    console.log(`${params.name}:${args.branch}`);
    if (args.force) {
      console.log("force");
    }
  },
});
