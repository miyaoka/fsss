import { defineCommand } from "../../../src/index";
import { string } from "@tskm/core";

export default defineCommand({
  description: "Open a file",
  args: {
    path: {
      type: string(),
      positional: true,
      description: "Target path",
      default: ".",
    },
  },
  run({ args }) {
    console.log(args.path);
  },
});
