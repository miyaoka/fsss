import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "プロダクションビルドを実行する",
  args: {
    outDir: {
      type: z.string(),
      description: "出力先ディレクトリ",
      default: "dist",
    },
    minify: {
      type: z.boolean(),
      description: "ミニファイを有効にする",
      default: true,
    },
  },
  run({ args }) {
    console.log(`Building to ${args.outDir} (minify: ${args.minify})`);
  },
});
