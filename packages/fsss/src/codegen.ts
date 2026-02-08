#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { parseArgs } from "node:util";

const PLUGINS_DIR_NAME = "_plugins";
const PLUGIN_FILE_EXTENSION = ".ts";
const INTERFACE_NAME_PATTERN = /export\s+interface\s+(\w+)/g;

interface PluginTypeInfo {
  // commandsDir からの相対パス（拡張子なし）
  importPath: string;
  interfaceNames: string[];
}

// commandsDir を再帰走査し、_plugins/ 内の .ts ファイルを収集する
async function findAllPluginFiles(commandsDir: string): Promise<string[]> {
  const result: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const fullPath = join(dir, entry.name);

      if (entry.name === PLUGINS_DIR_NAME) {
        const pluginEntries = await readdir(fullPath, { withFileTypes: true });
        for (const pe of pluginEntries) {
          if (pe.isFile() && pe.name.endsWith(PLUGIN_FILE_EXTENSION)) {
            result.push(join(fullPath, pe.name));
          }
        }
        continue;
      }

      await walk(fullPath);
    }
  }

  await walk(commandsDir);
  return result.sort();
}

// プラグインファイルから export interface 名を抽出する
async function extractInterfaceNames(filePath: string): Promise<string[]> {
  const content = await readFile(filePath, "utf-8");
  const names: string[] = [];

  let match: RegExpExecArray | null = INTERFACE_NAME_PATTERN.exec(content);
  while (match !== null) {
    names.push(match[1]);
    match = INTERFACE_NAME_PATTERN.exec(content);
  }

  return names;
}

// .fsss/extensions.d.ts を生成する
async function generateExtensionsType(commandsDir: string, outDir: string): Promise<void> {
  const pluginFiles = await findAllPluginFiles(commandsDir);

  const typeInfos: PluginTypeInfo[] = [];
  for (const filePath of pluginFiles) {
    const interfaceNames = await extractInterfaceNames(filePath);
    if (interfaceNames.length === 0) {
      continue;
    }

    // outDir から plugin ファイルへの相対パス（拡張子なし、./ prefix 付き）
    const relPath = relative(outDir, filePath).replace(/\.ts$/, "");
    const importPath = relPath.startsWith(".") ? relPath : `./${relPath}`;
    typeInfos.push({ importPath, interfaceNames });
  }

  const lines: string[] = ["// このファイルは自動生成されます。手動で編集しないでください。"];

  if (typeInfos.length === 0) {
    lines.push(
      "",
      'declare module "@miyaoka/fsss" {',
      "  // eslint-disable-next-line @typescript-eslint/no-empty-object-type",
      "  interface Extensions {}",
      "}",
      "",
    );
  } else {
    // import 文
    for (const info of typeInfos) {
      const names = info.interfaceNames.join(", ");
      lines.push(`import type { ${names} } from "${info.importPath}";`);
    }

    // declare module
    const allNames = typeInfos.flatMap((info) => info.interfaceNames);
    lines.push(
      "",
      'declare module "@miyaoka/fsss" {',
      `  interface Extensions extends ${allNames.join(", ")} {}`,
      "}",
      "",
    );
  }

  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, "extensions.d.ts");
  await writeFile(outPath, lines.join("\n"), "utf-8");
  console.log(`Generated ${outPath}`);
}

// CLI として実行された場合
const { values } = parseArgs({
  options: {
    commandsDir: { type: "string" },
    outDir: { type: "string" },
  },
});

if (values.commandsDir === undefined || values.outDir === undefined) {
  console.error("Usage: bun run codegen.ts --commandsDir <path> --outDir <path>");
  process.exit(1);
}

await generateExtensionsType(values.commandsDir, values.outDir);
