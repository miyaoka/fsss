import { defineCommand } from "../../../../src/index";
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
    console.log(args.key);
  },
});
