import { defineCommand } from "../../../src/index";
import { z } from "zod";

export default defineCommand({
  description: "Say hello",
  args: {
    name: {
      type: z.string(),
      positional: true,
      description: "Name",
    },
  },
  run({ args }) {
    console.log(`Hello, ${args.name}`);
  },
});
