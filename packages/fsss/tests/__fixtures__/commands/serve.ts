import { defineCommand } from "../../../src/index";
import { boolean, maxValue, minValue, number, pipe, string } from "@tskm/core";

export default defineCommand({
  description: "Start the server",
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
    verbose: {
      type: boolean(),
      description: "Verbose logging",
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
