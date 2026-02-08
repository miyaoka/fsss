#!/usr/bin/env bun

import { createCLI } from "fsss";

const cli = createCLI({
  commandsDir: import.meta.dirname + "/commands",
  name: "fsss-example",
});
await cli.run();
