import type { ArgDef, ArgsDefs } from "./types";
import { isBooleanSchema } from "./zod-utils";

interface HelpConfig {
  programName: string;
  commandPath: string[];
  description?: string;
  argsDefs?: ArgsDefs;
}

const INDENT = "  ";
const COLUMN_GAP = 2;

interface OptionLine {
  left: string;
  right: string;
}

function formatOptionMeta(def: ArgDef): string {
  const parts: string[] = [];

  if (def.env !== undefined) {
    parts.push(`env: ${def.env}`);
  }
  if ("default" in def && def.default !== undefined) {
    parts.push(`default: ${String(def.default)}`);
  }

  if (parts.length === 0) {
    return "";
  }
  return ` (${parts.join(", ")})`;
}

function formatOptionLine(name: string, def: ArgDef): OptionLine {
  const isBoolean = isBooleanSchema(def.type);
  const valuePlaceholder = isBoolean ? "" : ` <${name}>`;

  const aliasPrefix = def.alias !== undefined ? `-${def.alias}, ` : "    ";
  const left = `${aliasPrefix}--${name}${valuePlaceholder}`;
  const right = `${def.description}${formatOptionMeta(def)}`;

  return { left, right };
}

function formatHelpLine(): OptionLine {
  return {
    left: "-h, --help",
    right: "ヘルプを表示する",
  };
}

function generateHelp(config: HelpConfig): string {
  const { programName, commandPath, description, argsDefs } = config;
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
    return lines.join("\n");
  }

  // Options セクション
  const entries = Object.entries(argsDefs);
  const optionEntries = entries.filter(([, def]) => def.positional !== true);

  if (optionEntries.length === 0) {
    // フラグがなくても --help は表示
    lines.push("Options:");
    const helpLine = formatHelpLine();
    lines.push(`${INDENT}${helpLine.left}  ${helpLine.right}`);
    return lines.join("\n");
  }

  lines.push("Options:");

  const optionLines = optionEntries.map(([name, def]) => formatOptionLine(name, def));
  optionLines.push(formatHelpLine());

  // 左揃えのための最大幅を計算
  const maxLeftWidth = Math.max(...optionLines.map((l) => l.left.length));

  for (const line of optionLines) {
    const padding = " ".repeat(maxLeftWidth - line.left.length + COLUMN_GAP);
    lines.push(`${INDENT}${line.left}${padding}${line.right}`);
  }

  return lines.join("\n");
}

export { generateHelp };
export type { HelpConfig };
