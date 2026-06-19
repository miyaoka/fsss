import { defineCommand } from "../../../src/index";
import { string } from "@tskm/core";

export default defineCommand({
  description: "Say hello",
  args: {
    name: {
      type: string(),
      positional: true,
      description: "Name",
    },
  },
  run({ args }) {
    console.log(`Hello, ${args.name}`);
  },
});
