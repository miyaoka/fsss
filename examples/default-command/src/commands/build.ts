import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "Run production build",
  args: {
    outDir: {
      type: z.string(),
      description: "Output directory",
      default: "dist",
    },
    minify: {
      type: z.boolean(),
      description: "Enable minification",
      default: true,
    },
  },
  run({ args }) {
    console.log(`Building to ${args.outDir} (minify: ${args.minify})`);
  },
});
