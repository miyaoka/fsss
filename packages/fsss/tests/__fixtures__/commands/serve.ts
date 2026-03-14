import { defineCommand } from "../../../src/index";
import { z } from "zod";

export default defineCommand({
  description: "Start the server",
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
    verbose: {
      type: z.boolean(),
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
