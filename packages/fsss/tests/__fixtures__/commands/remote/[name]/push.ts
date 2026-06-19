import { defineCommand } from "../../../../../src/index";
import { boolean, string } from "@tskm/core";

export default defineCommand({
  description: "Push to remote",
  args: {
    branch: {
      type: string(),
      description: "Branch name",
      positional: true,
    },
    force: {
      type: boolean(),
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
