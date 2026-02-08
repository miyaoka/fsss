import { createCLI } from "../index";

const cli = createCLI({
  commandsDir: import.meta.dirname + "/commands",
  name: "test-cli",
});
await cli.run();
