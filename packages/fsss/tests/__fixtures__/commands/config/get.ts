import { defineCommand } from "../../../../src/index";
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
    console.log(args.key);
  },
});
