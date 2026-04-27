import { afterEach, describe, expect, test } from "bun:test";
import { readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { generateExtensionsType } from "../src/codegen";

const FIXTURES_DIR = resolve(import.meta.dirname, "__fixtures__");

describe("generateExtensionsType", () => {
  const tmpOutDirs: string[] = [];

  function createOutDir(name: string): string {
    const dir = join(FIXTURES_DIR, name, ".codegen-out");
    tmpOutDirs.push(dir);
    return dir;
  }

  afterEach(async () => {
    for (const dir of tmpOutDirs) {
      await rm(dir, { recursive: true, force: true });
    }
    tmpOutDirs.length = 0;
  });

  test("プラグインなしで export {} を含むモジュールファイルを生成する", async () => {
    const commandsDir = join(FIXTURES_DIR, "codegen-no-plugins", "commands");
    const outDir = createOutDir("codegen-no-plugins");

    await generateExtensionsType(commandsDir, outDir);

    const content = await readFile(join(outDir, "extensions.d.ts"), "utf-8");
    expect(content).toContain("export {};");
    expect(content).toContain('declare module "@miyaoka/fsss"');
    expect(content).toContain("interface Extensions {}");
    expect(content).not.toContain("import type");
  });

  test("プラグインありで import type を含むファイルを生成する", async () => {
    const commandsDir = join(FIXTURES_DIR, "codegen-with-plugins", "commands");
    const outDir = createOutDir("codegen-with-plugins");

    await generateExtensionsType(commandsDir, outDir);

    const content = await readFile(join(outDir, "extensions.d.ts"), "utf-8");
    expect(content).toContain("import type { LoggerExtension }");
    expect(content).toContain("interface Extensions extends LoggerExtension {}");
    expect(content).not.toContain("export {};");
  });
});
