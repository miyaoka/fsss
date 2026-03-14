import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "Say hello",
  args: {
    name: {
      type: z.string(),
      description: "Name",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`Hello, ${args.name}!`);
  },
});
