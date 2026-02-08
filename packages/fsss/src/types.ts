import type { z, ZodType } from "zod";

// --- 個々の arg 定義 ---

interface ArgDefBase<T extends ZodType> {
  type: T;
  description: string;
  alias?: string;
  positional?: boolean;
  default?: z.output<T>;
  env?: string;
  config?: string;
  multiple?: boolean;
}

// 外部から参照する場合の非ジェネリクス版
type ArgDef = ArgDefBase<ZodType>;

// ユーザーが定義する args オブジェクトの型
type ArgsDefs = Record<string, ArgDef>;

// --- args 定義から推論される解決済みの値の型 ---

type InferArgs<T extends ArgsDefs> = {
  [K in keyof T]: T[K]["multiple"] extends true ? z.output<T[K]["type"]>[] : z.output<T[K]["type"]>;
};

// --- params の型 ---
// ルーターが抽出する動的セグメントの型
// ファイルシステムに依存するため静的推論は不可

type Params = Record<string, string>;

// --- プラグインシステム ---

// ユーザーが declare module '@miyaoka/fsss' で拡張する interface
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Extensions {}

// ミドルウェア
interface MiddlewareContext {
  commandPath: string[];
  params: Params;
  args: Record<string, unknown>;
  extensions: Extensions;
}

type Middleware = (context: MiddlewareContext, next: () => Promise<void>) => Promise<void>;

// プラグイン
interface PluginContext {
  cliName: string;
}

interface PluginConfig {
  provide?: Partial<Extensions>;
  middleware?: Middleware;
}

type PluginSetup = (context: PluginContext) => PluginConfig | Promise<PluginConfig>;

// --- コマンド定義 ---

interface RunContext<T extends ArgsDefs> {
  params: Params;
  args: InferArgs<T>;
  extensions: Extensions;
}

interface CommandConfig<T extends ArgsDefs = ArgsDefs> {
  description?: string;
  args?: T;
  run: (context: RunContext<T>) => void | Promise<void>;
}

// --- defineCommand ---
// ジェネリクスで T を推論させるための identity function
// TypeScript は config.args のオブジェクトリテラルから T を推論し、
// その T が run 関数の context.args の型に伝播する

function defineCommand<T extends ArgsDefs>(config: CommandConfig<T>): CommandConfig<T> {
  return config;
}

export { defineCommand };
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
};
