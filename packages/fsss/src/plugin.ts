import type {
  Extensions,
  Middleware,
  MiddlewareContext,
  PluginContext,
  PluginSetup,
} from "./types";

interface ResolvedPlugins {
  extensions: Extensions;
  middlewares: Middleware[];
}

function definePlugin(setup: PluginSetup): PluginSetup {
  return setup;
}

async function resolvePlugins(
  plugins: PluginSetup[],
  pluginContext: PluginContext,
): Promise<ResolvedPlugins> {
  const accumulated: Record<string, unknown> = {};
  const middlewares: Middleware[] = [];

  for (const setup of plugins) {
    const config = await setup(pluginContext);
    if (config.provide !== undefined) {
      Object.assign(accumulated, config.provide);
    }
    if (config.middleware !== undefined) {
      middlewares.push(config.middleware);
    }
  }

  // プラグインの provide を蓄積した結果を Extensions に変換する
  // 各プラグインが declare module で型を拡張するため、実行時の型は保証される
  return { extensions: accumulated as Extensions, middlewares };
}

// onion model: plugins[0] → plugins[1] → ... → finalHandler → ... → plugins[0]
function buildMiddlewareChain(
  middlewares: Middleware[],
  finalHandler: (context: MiddlewareContext) => Promise<void>,
): (context: MiddlewareContext) => Promise<void> {
  let chain = finalHandler;

  // 逆順に畳み込み、最初に登録されたミドルウェアが最も外側になる
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const middleware = middlewares[i];
    const next = chain;
    chain = (ctx) => middleware(ctx, () => next(ctx));
  }

  return chain;
}

export { buildMiddlewareChain, definePlugin, resolvePlugins };
export type { ResolvedPlugins };
