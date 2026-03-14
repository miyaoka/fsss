import { deriveEnvName } from "./auto-mapping";
import type { AvailableEntry } from "./router";
import type { ArgDef, ArgsDefs } from "./types";
import { isBooleanSchema } from "./zod-utils";

interface HelpConfig {
  programName: string;
  commandPath: string[];
  description?: string;
  argsDefs?: ArgsDefs;
  envPrefix?: string;
  showVersion: boolean;
  versionAlias?: string;
}

const INDENT = "  ";
const COLUMN_GAP = 2;

interface OptionLine {
  left: string;
  right: string;
}

// env 名を解決する（明示指定 > 自動導出 > なし）
function resolveEnvNameForHelp(
  def: ArgDef,
  envPrefix: string | undefined,
  commandPath: string[],
  argName: string,
): string | undefined {
  if (def.env !== undefined) {
    return def.env;
  }
  if (envPrefix !== undefined) {
    return deriveEnvName(envPrefix, commandPath, argName);
  }
  return undefined;
}

// ヘルプ表示用にデフォルト値を文字列化する
// string/number/boolean はそのまま表示し、それ以外は JSON.stringify にフォールバック
function formatDefaultValue(value: unknown): string {
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    default:
      return JSON.stringify(value);
  }
}

function formatOptionMeta(def: ArgDef, envName: string | undefined): string {
  const parts: string[] = [];

  if (envName !== undefined) {
    parts.push(`env: ${envName}`);
  }
  if ("default" in def && def.default !== undefined) {
    parts.push(`default: ${formatDefaultValue(def.default)}`);
  }

  if (parts.length === 0) {
    return "";
  }
  return ` (${parts.join(", ")})`;
}

function formatOptionLine(
  name: string,
  def: ArgDef,
  envPrefix: string | undefined,
  commandPath: string[],
): OptionLine {
  const isBoolean = isBooleanSchema(def.type);
  const valuePlaceholder = isBoolean ? "" : ` <${name}>`;

  const aliasPrefix = def.alias !== undefined ? `-${def.alias}, ` : "    ";
  const left = `${aliasPrefix}--${name}${valuePlaceholder}`;
  const envName = resolveEnvNameForHelp(def, envPrefix, commandPath, name);
  const right = `${def.description}${formatOptionMeta(def, envName)}`;

  return { left, right };
}

function formatHelpLine(): OptionLine {
  return {
    left: "-h, --help",
    right: "ヘルプを表示する",
  };
}

function formatVersionLine(alias: string | undefined): OptionLine {
  const aliasPrefix = alias !== undefined ? `-${alias}, ` : "    ";
  return {
    left: `${aliasPrefix}--version`,
    right: "バージョンを表示する",
  };
}

function generateHelp(config: HelpConfig): string {
  const { programName, commandPath, description, argsDefs, envPrefix, showVersion, versionAlias } =
    config;
  const lines: string[] = [];

  if (description !== undefined) {
    lines.push(description);
    lines.push("");
  }

  // Usage 行
  const usageParts = [programName, ...commandPath];
  if (argsDefs !== undefined) {
    const entries = Object.entries(argsDefs);
    const hasPositionals = entries.some(([, def]) => def.positional === true);
    const hasFlags = entries.some(([, def]) => def.positional !== true);

    if (hasPositionals) {
      // 位置引数の名前を表示
      const positionalNames = entries
        .filter(([, def]) => def.positional === true)
        .map(([name]) => `<${name}>`);
      usageParts.push(...positionalNames);
    }
    if (hasFlags) {
      usageParts.push("[options]");
    }
  }
  lines.push(`Usage: ${usageParts.join(" ")}`);
  lines.push("");

  if (argsDefs === undefined) {
    if (showVersion) {
      lines.push("Options:");
      const builtinLines = [formatHelpLine(), formatVersionLine(versionAlias)];
      const maxLeftWidth = Math.max(...builtinLines.map((l) => l.left.length));
      for (const line of builtinLines) {
        const padding = " ".repeat(maxLeftWidth - line.left.length + COLUMN_GAP);
        lines.push(`${INDENT}${line.left}${padding}${line.right}`);
      }
    }
    return lines.join("\n");
  }

  // Options セクション
  const entries = Object.entries(argsDefs);
  const optionEntries = entries.filter(([, def]) => def.positional !== true);

  if (optionEntries.length === 0) {
    // フラグがなくても --help は表示
    lines.push("Options:");
    const builtinLines = [formatHelpLine()];
    if (showVersion) {
      builtinLines.push(formatVersionLine(versionAlias));
    }
    const maxLeftWidth = Math.max(...builtinLines.map((l) => l.left.length));
    for (const line of builtinLines) {
      const padding = " ".repeat(maxLeftWidth - line.left.length + COLUMN_GAP);
      lines.push(`${INDENT}${line.left}${padding}${line.right}`);
    }
    return lines.join("\n");
  }

  lines.push("Options:");

  const optionLines = optionEntries.map(([name, def]) =>
    formatOptionLine(name, def, envPrefix, commandPath),
  );
  optionLines.push(formatHelpLine());
  if (showVersion) {
    optionLines.push(formatVersionLine(versionAlias));
  }

  // 左揃えのための最大幅を計算
  const maxLeftWidth = Math.max(...optionLines.map((l) => l.left.length));

  for (const line of optionLines) {
    const padding = " ".repeat(maxLeftWidth - line.left.length + COLUMN_GAP);
    lines.push(`${INDENT}${line.left}${padding}${line.right}`);
  }

  return lines.join("\n");
}

// ルート未解決時のサブコマンド一覧ヘルプを生成する
interface SubcommandHelpConfig {
  programName: string;
  commandPath: string[];
  availableEntries: AvailableEntry[];
}

function generateSubcommandHelp(config: SubcommandHelpConfig): string {
  const { programName, commandPath, availableEntries } = config;
  const lines: string[] = [];

  const prefix = [programName, ...commandPath].join(" ");
  lines.push(`Usage: ${prefix} <command>`);
  lines.push("");

  if (availableEntries.length === 0) {
    lines.push("No available commands.");
    return lines.join("\n");
  }

  lines.push("Available commands:");
  for (const entry of availableEntries) {
    if (entry.isDynamic) {
      lines.push(`${INDENT}<${entry.paramName}>`);
      continue;
    }
    lines.push(`${INDENT}${entry.name}`);
  }

  return lines.join("\n");
}

// バリデーションエラー時のヘルプを生成する
// コマンドのヘルプにエラーメッセージを付加する
function generateValidationErrorHelp(helpText: string, errors: string[]): string {
  const lines = [`Error: ${errors.join(", ")}`, "", helpText];
  return lines.join("\n");
}

// defaultCommand 設定時のルートヘルプを生成する
// サブコマンド一覧 + デフォルトコマンドの Options を統合表示する
interface DefaultCommandHelpConfig {
  programName: string;
  defaultCommandName: string;
  commandPath: string[];
  description?: string;
  argsDefs?: ArgsDefs;
  envPrefix?: string;
  showVersion: boolean;
  versionAlias?: string;
  availableEntries: AvailableEntry[];
}

function generateDefaultCommandHelp(config: DefaultCommandHelpConfig): string {
  const {
    programName,
    defaultCommandName,
    commandPath,
    description,
    argsDefs,
    envPrefix,
    showVersion,
    versionAlias,
    availableEntries,
  } = config;
  const lines: string[] = [];

  if (description !== undefined) {
    lines.push(description);
    lines.push("");
  }

  // Usage 行（options + command の2行）
  const hasFlags =
    argsDefs !== undefined && Object.entries(argsDefs).some(([, def]) => def.positional !== true);
  if (hasFlags) {
    lines.push(`Usage: ${programName} [options]`);
  } else {
    lines.push(`Usage: ${programName}`);
  }
  lines.push(`       ${programName} <command>`);
  lines.push("");

  // Options セクション（デフォルトコマンドの args から生成）
  if (argsDefs !== undefined) {
    const entries = Object.entries(argsDefs);
    const optionEntries = entries.filter(([, def]) => def.positional !== true);

    if (optionEntries.length > 0) {
      lines.push("Options:");

      const optionLines = optionEntries.map(([name, def]) =>
        formatOptionLine(name, def, envPrefix, commandPath),
      );
      optionLines.push(formatHelpLine());
      if (showVersion) {
        optionLines.push(formatVersionLine(versionAlias));
      }

      const maxLeftWidth = Math.max(...optionLines.map((l) => l.left.length));

      for (const line of optionLines) {
        const padding = " ".repeat(maxLeftWidth - line.left.length + COLUMN_GAP);
        lines.push(`${INDENT}${line.left}${padding}${line.right}`);
      }
      lines.push("");
    }
  }

  // Available commands セクション
  if (availableEntries.length > 0) {
    lines.push("Available commands:");
    for (const entry of availableEntries) {
      if (entry.isDynamic) {
        lines.push(`${INDENT}<${entry.paramName}>`);
        continue;
      }
      const suffix = entry.name === defaultCommandName ? " (default)" : "";
      lines.push(`${INDENT}${entry.name}${suffix}`);
    }
  }

  return lines.join("\n");
}

export {
  generateDefaultCommandHelp,
  generateHelp,
  generateSubcommandHelp,
  generateValidationErrorHelp,
};
export type { DefaultCommandHelpConfig, HelpConfig, SubcommandHelpConfig };
