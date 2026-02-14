#!/usr/bin/env bun

import { join } from "node:path";
import { createCLI } from "@miyaoka/fsss";

const cli = createCLI({
  name: "myapp",
  commandsDir: join(import.meta.dirname, "commands"),
  autoEnv: { prefix: "MYAPP" },
  defaultCommand: "serve",
});
await cli.run();
