import { defineCommand } from "@miyaoka/fsss";
import { maxValue, minValue, number, pipe, string } from "@tskm/core";

export default defineCommand({
  description: "Start the dev server",
  args: {
    port: {
      type: pipe(number(), minValue(1), maxValue(65535)),
      description: "Port number",
      alias: "p",
      default: 3000,
    },
    host: {
      type: string(),
      description: "Hostname",
      default: "localhost",
    },
  },
  run({ args }) {
    console.log(`Server running at http://${args.host}:${args.port}`);
  },
});
