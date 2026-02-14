import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "開発サーバーを起動する",
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
  },
  run({ args }) {
    console.log(`Server running at http://${args.host}:${args.port}`);
  },
});
