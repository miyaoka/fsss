import { defineCommand } from "../../../../src/index";
import { string } from "@tskm/core";

export default defineCommand({
  description: "Set a config value",
  args: {
    key: {
      type: string(),
      description: "Config key",
      positional: true,
    },
    value: {
      type: string(),
      description: "Config value",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`${args.key}=${args.value}`);
  },
});
