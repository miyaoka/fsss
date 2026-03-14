import { defineCommand } from "@miyaoka/fsss";
import { z } from "zod";

export default defineCommand({
  description: "Start the dev server",
  args: {
    port: {
      type: z.coerce.number().min(1).max(65535),
      description: "Port number",
      alias: "p",
      default: 3000,
    },
    host: {
      type: z.string(),
      description: "Hostname",
      default: "localhost",
    },
  },
  run({ args }) {
    console.log(`Server running at http://${args.host}:${args.port}`);
  },
});
