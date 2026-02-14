import { definePlugin } from "@miyaoka/fsss";

export interface AuthExtensions {
  auth: {
    token: string;
  };
}

const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;

export default definePlugin(() => ({
  provide: {
    auth: {
      token: "dummy-token-12345",
    },
  },
  middleware: async (_ctx, next) => {
    console.log(dim(`[auth] ${green("authenticated")} (token: dummy-token-12345)`));
    await next();
  },
}));
