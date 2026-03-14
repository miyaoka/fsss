import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "Set a config value",
  args: {
    key: {
      type: z.string(),
      description: "Config key",
      positional: true,
    },
    value: {
      type: z.string(),
      description: "Config value",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`Setting ${args.key} = ${args.value}`);
  },
});
