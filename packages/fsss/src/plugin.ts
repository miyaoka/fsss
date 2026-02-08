import type { Dirent } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type {
  Extensions,
  Middleware,
  MiddlewareContext,
  PluginContext,
  PluginSetup,
} from "./types";

const PLUGINS_DIR_NAME = "_plugins";
const PLUGIN_FILE_EXTENSION = ".ts";

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

// traversedDirs の各ディレクトリから _plugins/ をスキャンし、プラグインを自動登録する
// root → leaf の順で適用（外側のミドルウェアが先に実行される）
async function scanPluginsAlongPath(
  traversedDirs: string[],
  pluginContext: PluginContext,
): Promise<ResolvedPlugins> {
  const allSetups: PluginSetup[] = [];

  for (const dir of traversedDirs) {
    const pluginsDir = join(dir, PLUGINS_DIR_NAME);

    let entries: Dirent[];
    try {
      entries = await readdir(pluginsDir, { withFileTypes: true });
    } catch {
      // _plugins/ が存在しない → スキップ
      continue;
    }

    // ファイル名順でソートし、適用順序を決定的にする
    const pluginFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith(PLUGIN_FILE_EXTENSION))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const file of pluginFiles) {
      const filePath = join(pluginsDir, file.name);
      const mod = await import(filePath);
      const setup: PluginSetup | undefined = mod.default;
      if (setup === undefined) {
        throw new Error(`Plugin file ${filePath} does not have a default export`);
      }
      allSetups.push(setup);
    }
  }

  return resolvePlugins(allSetups, pluginContext);
}

export { buildMiddlewareChain, definePlugin, resolvePlugins, scanPluginsAlongPath };
export type { ResolvedPlugins };
