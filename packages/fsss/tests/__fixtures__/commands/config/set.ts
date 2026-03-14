import { defineCommand } from "../../../../src/index";
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
    console.log(`${args.key}=${args.value}`);
  },
});
