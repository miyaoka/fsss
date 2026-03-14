import { join } from "node:path";
import { createCLI } from "../../src/index";

const cli = createCLI({
  commandsDir: join(import.meta.dirname, "root-index-commands"),
  name: "test-cli",
});
await cli.run();
