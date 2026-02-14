import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "挨拶する",
  args: {
    name: {
      type: z.string(),
      description: "名前",
      positional: true,
    },
  },
  run({ args }) {
    console.log(`Hello, ${args.name}!`);
  },
});
