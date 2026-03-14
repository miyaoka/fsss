import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "Get a config value",
  args: {
    key: {
      type: z.string(),
      description: "Config key",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`Getting value for: ${args.key}`);
  },
});
