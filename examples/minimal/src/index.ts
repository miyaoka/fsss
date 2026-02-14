#!/usr/bin/env bun

import { join } from "node:path";
import { createCLI } from "@miyaoka/fsss";

const cli = createCLI({
  name: "minimal",
  commandsDir: join(import.meta.dirname, "commands"),
});
await cli.run();
