import { defineCommand } from "@miyaoka/fsss";
import { string } from "@tskm/core";

export default defineCommand({
  description: "Get a config value",
  args: {
    key: {
      type: string(),
      description: "Config key",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`Getting value for: ${args.key}`);
  },
});
