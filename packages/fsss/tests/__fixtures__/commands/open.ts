import { defineCommand } from "../../../src/index";
import { z } from "zod";

export default defineCommand({
  description: "Open a file",
  args: {
    path: {
      type: z.string(),
      positional: true,
      description: "Target path",
      default: ".",
    },
  },
  run({ args }) {
    console.log(args.path);
  },
});
