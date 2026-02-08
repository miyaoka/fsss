import { defineCommand } from "fsss";
import { z } from "zod";

export default defineCommand({
  description: "サーバーを起動する",
  args: {
    port: {
      type: z.coerce.number().min(1).max(65535),
      description: "ポート番号",
      alias: "p",
      default: 3000,
    },
    host: {
      type: z.string(),
      description: "ホスト名",
      default: "localhost",
    },
    verbose: {
      type: z.boolean(),
      description: "詳細ログ",
      alias: "v",
      default: false,
    },
  },
  run({ args }) {
    console.log(`Server starting on ${args.host}:${args.port}`);
    if (args.verbose) {
      console.log("Verbose mode enabled");
    }
  },
});
