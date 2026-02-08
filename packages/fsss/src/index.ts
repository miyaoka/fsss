// fsss — File Structure, Single Schema
export { createCLI } from "./cli";
export { definePlugin } from "./plugin";
export { defineCommand } from "./types";
export type { CLI, CLIOptions } from "./cli";
export type {
  ArgDef,
  ArgDefBase,
  ArgsDefs,
  CommandConfig,
  Extensions,
  InferArgs,
  Middleware,
  MiddlewareContext,
  Params,
  PluginConfig,
  PluginContext,
  PluginSetup,
  RunContext,
} from "./types";
