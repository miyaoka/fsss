import { defineCommand } from "@miyaoka/fsss";
import { boolean, string } from "@tskm/core";

export default defineCommand({
  description: "Run production build",
  args: {
    outDir: {
      type: string(),
      description: "Output directory",
      default: "dist",
    },
    minify: {
      type: boolean(),
      description: "Enable minification",
      default: true,
    },
  },
  run({ args }) {
    console.log(`Building to ${args.outDir} (minify: ${args.minify})`);
  },
});
