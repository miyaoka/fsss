import { definePlugin } from "@miyaoka/fsss";

export interface LoggerExtensions {
  logger: {
    info: (message: string) => void;
    error: (message: string) => void;
  };
}

// ANSI カラーコード
const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

export default definePlugin(({ cliName }) => ({
  provide: {
    logger: {
      info: (msg: string) => console.log(`${cyan(`[${cliName}]`)} ${green("INFO")} ${msg}`),
      error: (msg: string) => console.error(`${cyan(`[${cliName}]`)} ${red("ERROR")} ${msg}`),
    },
  },
  middleware: async (_ctx, next) => {
    const start = performance.now();
    await next();
    const elapsed = (performance.now() - start).toFixed(0);
    console.log(
      `${cyan(`[${cliName}]`)} ${dim(new Date().toLocaleString())} ${yellow(`${elapsed}ms`)}`,
    );
  },
}));
