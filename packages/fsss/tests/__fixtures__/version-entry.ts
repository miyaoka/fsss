import { join } from "node:path";
import { createCLI } from "../../src/index";

const cli = createCLI({
  commandsDir: join(import.meta.dirname, "commands"),
  name: "test-cli",
  autoEnv: { prefix: "TEST" },
  version: "1.2.3",
});
await cli.run();
