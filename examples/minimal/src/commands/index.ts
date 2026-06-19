import { defineCommand } from "@miyaoka/fsss";
import { string } from "@tskm/core";

export default defineCommand({
  description: "Say hello",
  args: {
    name: {
      type: string(),
      description: "Name",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`Hello, ${args.name}!`);
  },
});
