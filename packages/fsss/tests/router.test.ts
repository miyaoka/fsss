import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { resolveRoute } from "../src/router";

const FIXTURES_DIR = resolve(import.meta.dirname, "__fixtures__");

// --- .js ファイルの認識 ---

describe("js command files", () => {
  const jsCommandsDir = resolve(FIXTURES_DIR, "js-commands");

  test(".js ファイルをコマンドとして認識する", async () => {
    const result = await resolveRoute(jsCommandsDir, ["hello"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/hello.js");
    }
  });

  test(".js の index ファイルを認識する", async () => {
    const result = await resolveRoute(jsCommandsDir, []);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/index.js");
    }
  });

  test("サブディレクトリ内の .js ファイルを認識する", async () => {
    const result = await resolveRoute(jsCommandsDir, ["sub", "action"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/sub/action.js");
    }
  });

  test("サブコマンド一覧に .js コマンドが含まれる", async () => {
    // index.js があるディレクトリでは nonexistent でも index にフォールバックするため、
    // index がない sub ディレクトリで未解決ケースをテスト
    const subDir = resolve(jsCommandsDir, "sub");
    const result = await resolveRoute(subDir, ["nonexistent"]);
    expect(result.kind).toBe("unresolved");
    if (result.kind === "unresolved") {
      const names = result.availableEntries.map((e) => e.name);
      expect(names).toContain("action");
    }
  });
});

// --- .ts と .js の優先順位 ---

describe("mixed ts/js command files", () => {
  const mixedCommandsDir = resolve(FIXTURES_DIR, "mixed-commands");

  test("同名の .ts と .js がある場合 .ts が優先される", async () => {
    const result = await resolveRoute(mixedCommandsDir, ["hello"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/hello.ts");
    }
  });

  test("同名の index.ts と index.js がある場合 index.ts が優先される", async () => {
    const result = await resolveRoute(mixedCommandsDir, []);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/index.ts");
    }
  });

  test(".ts のみのコマンドが認識される", async () => {
    const result = await resolveRoute(mixedCommandsDir, ["only-ts"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/only-ts.ts");
    }
  });

  test(".js のみのコマンドが認識される", async () => {
    const result = await resolveRoute(mixedCommandsDir, ["only-js"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/only-js.js");
    }
  });

  test("サブコマンド一覧で同名の .ts/.js が重複しない", async () => {
    // index があるディレクトリでは index にフォールバックするため、index がない sub で検証
    const subDir = resolve(mixedCommandsDir, "sub");
    const result = await resolveRoute(subDir, ["nonexistent"]);
    expect(result.kind).toBe("unresolved");
    if (result.kind === "unresolved") {
      const names = result.availableEntries.map((e) => e.name);
      // extra は .ts と .js 両方あるが、一覧には1回だけ出る
      expect(names.filter((n) => n === "extra")).toHaveLength(1);
      expect(names).toContain("nested");
      expect(names).toContain("only-ts-sub");
      expect(names).toContain("only-js-sub");
    }
  });

  test("サブディレクトリ内でも .ts が .js より優先される", async () => {
    const result = await resolveRoute(mixedCommandsDir, ["sub", "nested"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/nested.ts");
    }
  });
});

// --- 既存の .ts ファイルの動作が壊れていないことの確認 ---

describe("existing ts command files", () => {
  const commandsDir = resolve(FIXTURES_DIR, "commands");

  test(".ts コマンドファイルが引き続き認識される", async () => {
    const result = await resolveRoute(commandsDir, ["serve"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/serve.ts");
    }
  });

  test("ネストした .ts コマンドが認識される", async () => {
    const result = await resolveRoute(commandsDir, ["config", "set"]);
    expect(result.kind).toBe("resolved");
    if (result.kind === "resolved") {
      expect(result.filePath).toEndWith("/config/set.ts");
    }
  });
});
