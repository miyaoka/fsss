interface ParsedTokens {
  flags: Map<string, string[]>;
  positionals: string[];
  doubleDashArgs: string[];
}

interface ParserConfig {
  booleanFlags: Set<string>;
  aliases: Map<string, string>;
}

const LONG_FLAG_PREFIX = "--";
const SHORT_FLAG_PREFIX = "-";
const DOUBLE_DASH = "--";
const NEGATION_PREFIX = "--no-";
const BOOLEAN_TRUE = "true";
const BOOLEAN_FALSE = "false";

function addFlag(flags: Map<string, string[]>, name: string, value: string): void {
  const existing = flags.get(name);
  if (existing) {
    existing.push(value);
    return;
  }
  flags.set(name, [value]);
}

// 次のトークンがフラグか、またはトークン配列の末尾かを判定
function isNextTokenAvailable(tokens: string[], index: number): boolean {
  if (index + 1 >= tokens.length) {
    return false;
  }
  return !tokens[index + 1].startsWith(SHORT_FLAG_PREFIX);
}

function parseTokens(tokens: string[], config: ParserConfig): ParsedTokens {
  const flags = new Map<string, string[]>();
  const positionals: string[] = [];
  let doubleDashArgs: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    // -- 以降はすべて位置引数
    if (token === DOUBLE_DASH) {
      doubleDashArgs = tokens.slice(i + 1);
      break;
    }

    // --no-flag（ブーリアン否定）
    if (token.startsWith(NEGATION_PREFIX)) {
      const flagName = token.slice(NEGATION_PREFIX.length);
      addFlag(flags, flagName, BOOLEAN_FALSE);
      i++;
      continue;
    }

    // --flag=value
    if (token.startsWith(LONG_FLAG_PREFIX) && token.includes("=")) {
      const eqIndex = token.indexOf("=");
      const flagName = token.slice(LONG_FLAG_PREFIX.length, eqIndex);
      const value = token.slice(eqIndex + 1);
      addFlag(flags, flagName, value);
      i++;
      continue;
    }

    // --flag [value]
    if (token.startsWith(LONG_FLAG_PREFIX)) {
      const flagName = token.slice(LONG_FLAG_PREFIX.length);

      if (config.booleanFlags.has(flagName)) {
        addFlag(flags, flagName, BOOLEAN_TRUE);
        i++;
        continue;
      }

      if (isNextTokenAvailable(tokens, i)) {
        addFlag(flags, flagName, tokens[i + 1]);
        i += 2;
        continue;
      }

      throw new Error(`Flag --${flagName} requires a value`);
    }

    // -f=value
    if (
      token.startsWith(SHORT_FLAG_PREFIX) &&
      !token.startsWith(LONG_FLAG_PREFIX) &&
      token.includes("=")
    ) {
      const eqIndex = token.indexOf("=");
      const shortFlag = token.slice(SHORT_FLAG_PREFIX.length, eqIndex);
      const value = token.slice(eqIndex + 1);
      const resolvedName = config.aliases.get(shortFlag) ?? shortFlag;
      addFlag(flags, resolvedName, value);
      i++;
      continue;
    }

    // -f [value]
    if (token.startsWith(SHORT_FLAG_PREFIX) && !token.startsWith(LONG_FLAG_PREFIX)) {
      const shortFlag = token.slice(SHORT_FLAG_PREFIX.length);
      const resolvedName = config.aliases.get(shortFlag) ?? shortFlag;

      if (config.booleanFlags.has(resolvedName)) {
        addFlag(flags, resolvedName, BOOLEAN_TRUE);
        i++;
        continue;
      }

      if (isNextTokenAvailable(tokens, i)) {
        addFlag(flags, resolvedName, tokens[i + 1]);
        i += 2;
        continue;
      }

      throw new Error(`Flag -${shortFlag} requires a value`);
    }

    // 位置引数
    positionals.push(token);
    i++;
  }

  return { flags, positionals, doubleDashArgs };
}

export { parseTokens };
export type { ParsedTokens, ParserConfig };
