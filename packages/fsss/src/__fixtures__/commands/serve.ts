import { defineCommand } from "../../index";
import { z } from "zod";

export default defineCommand({
  description: "サーバーを起動する",
  args: {
    port: {
      type: z.coerce.number().min(1).max(65535),
      description: "ポート番号",
      alias: "p",
      default: 3000,
      env: "PORT",
    },
    host: {
      type: z.string(),
      description: "ホスト名",
      default: "localhost",
      env: "HOST",
    },
    verbose: {
      type: z.boolean(),
      description: "詳細ログ",
      alias: "v",
      default: false,
    },
  },
  run({ args }) {
    console.log(`${args.host}:${args.port}`);
    if (args.verbose) {
      console.log("verbose");
    }
  },
});
