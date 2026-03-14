import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const ENTRY = resolve(import.meta.dirname, "__fixtures__/cli-entry.ts");
const ROOT_INDEX_ENTRY = resolve(import.meta.dirname, "__fixtures__/root-index-entry.ts");
const DEFAULT_COMMAND_ENTRY = resolve(import.meta.dirname, "__fixtures__/default-command-entry.ts");
const DEFAULT_COMMAND_POSITIONAL_ENTRY = resolve(
  import.meta.dirname,
  "__fixtures__/default-command-positional-entry.ts",
);
const VERSION_ENTRY = resolve(import.meta.dirname, "__fixtures__/version-entry.ts");
const VERSION_NO_ALIAS_ENTRY = resolve(
  import.meta.dirname,
  "__fixtures__/version-no-alias-entry.ts",
);
const VERSION_CUSTOM_ALIAS_ENTRY = resolve(
  import.meta.dirname,
  "__fixtures__/version-custom-alias-entry.ts",
);
const VERSION_DEFAULT_COMMAND_ENTRY = resolve(
  import.meta.dirname,
  "__fixtures__/version-default-command-entry.ts",
);
const VERSION_DEFAULT_COMMAND_POSITIONAL_ENTRY = resolve(
  import.meta.dirname,
  "__fixtures__/version-default-command-positional-entry.ts",
);
const CONFIG_PATH = resolve(import.meta.dirname, "__fixtures__/test-config.json");

async function runCLI(
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

async function runCLIWithEnv(
  env: Record<string, string>,
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ...env },
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

async function runDefaultCLI(
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", DEFAULT_COMMAND_ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

// --- ルーティング ---

describe("routing", () => {
  test("引数なしでサブコマンド一覧を表示する", async () => {
    const { stdout, exitCode } = await runCLI();
    expect(stdout).toContain("Available commands:");
    expect(stdout).toContain("serve");
    expect(stdout).toContain("config");
    expect(stdout).toContain("remote");
    expect(exitCode).toBe(0);
  });

  test("存在しないコマンドでサブコマンド一覧を表示する", async () => {
    const { stdout, exitCode } = await runCLI("nonexistent");
    expect(stdout).toContain("Available commands:");
    expect(exitCode).toBe(0);
  });
});

// --- serve コマンド ---

describe("serve", () => {
  test("デフォルト値で実行する", async () => {
    const { stdout, exitCode } = await runCLI("serve");
    expect(stdout).toBe("localhost:3000");
    expect(exitCode).toBe(0);
  });

  test("--port と --host フラグで値を上書きする", async () => {
    const { stdout } = await runCLI("serve", "--port", "8080", "--host", "0.0.0.0");
    expect(stdout).toBe("0.0.0.0:8080");
  });

  test("-p エイリアスでポートを指定する", async () => {
    const { stdout } = await runCLI("serve", "-p", "4000");
    expect(stdout).toBe("localhost:4000");
  });

  test("--port=8080 の = 記法で値を指定する", async () => {
    const { stdout } = await runCLI("serve", "--port=8080");
    expect(stdout).toBe("localhost:8080");
  });

  test("-v でverboseを有効にする", async () => {
    const { stdout } = await runCLI("serve", "-v");
    expect(stdout).toContain("verbose");
  });

  test("--no-verbose でverboseを無効にする", async () => {
    const { stdout } = await runCLI("serve", "--no-verbose");
    expect(stdout).not.toContain("verbose");
  });

  test("自動導出 env TEST_SERVE_PORT から値を取得する", async () => {
    const { stdout } = await runCLIWithEnv({ TEST_SERVE_PORT: "9090" }, "serve");
    expect(stdout).toBe("localhost:9090");
  });

  test("CLI フラグが環境変数より優先される", async () => {
    const { stdout } = await runCLIWithEnv({ TEST_SERVE_PORT: "9090" }, "serve", "--port", "4000");
    expect(stdout).toBe("localhost:4000");
  });

  test("--help でヘルプを表示する（自動導出 env 名を含む）", async () => {
    const { stdout, exitCode } = await runCLI("serve", "--help");
    expect(stdout).toContain("Start the server");
    expect(stdout).toContain("Usage: test-cli serve");
    expect(stdout).toContain("--port");
    expect(stdout).toContain("--host");
    expect(stdout).toContain("--verbose");
    expect(stdout).toContain("--help");
    expect(stdout).toContain("env: TEST_SERVE_PORT");
    expect(stdout).toContain("env: TEST_SERVE_HOST");
    expect(exitCode).toBe(0);
  });

  test("-h でヘルプを表示する", async () => {
    const { stdout, exitCode } = await runCLI("serve", "-h");
    expect(stdout).toContain("Usage: test-cli serve");
    expect(exitCode).toBe(0);
  });

  test("ポートの範囲外の値でバリデーションエラーを表示する", async () => {
    const { stderr, exitCode } = await runCLI("serve", "--port", "99999");
    expect(stderr).toContain("Error:");
    expect(stderr).toContain("Usage:");
    expect(exitCode).toBe(1);
  });

  test("値が必要なフラグに値を渡さないとエラーヘルプを表示する", async () => {
    const { stderr, exitCode } = await runCLI("serve", "-p");
    expect(stderr).toContain("Error:");
    expect(stderr).toContain("Usage:");
    expect(exitCode).toBe(1);
  });
});

// --- config コマンド ---

describe("config", () => {
  test("config set で位置引数を受け取る", async () => {
    const { stdout, exitCode } = await runCLI("config", "set", "foo", "bar");
    expect(stdout).toBe("foo=bar");
    expect(exitCode).toBe(0);
  });

  test("config get で位置引数を受け取る", async () => {
    const { stdout, exitCode } = await runCLI("config", "get", "mykey");
    expect(stdout).toBe("mykey");
    expect(exitCode).toBe(0);
  });

  test("config set で引数なしの場合はヘルプを表示する", async () => {
    const { stdout, exitCode } = await runCLI("config", "set");
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("<key>");
    expect(exitCode).toBe(0);
  });

  test("config 単体でサブコマンド一覧を表示する", async () => {
    const { stdout, exitCode } = await runCLI("config");
    expect(stdout).toContain("Available commands:");
    expect(stdout).toContain("set");
    expect(stdout).toContain("get");
    expect(exitCode).toBe(0);
  });
});

// --- remote コマンド（動的セグメント） ---

describe("remote", () => {
  test("remote <name> push <branch> で実行する", async () => {
    const { stdout, exitCode } = await runCLI("remote", "origin", "push", "main");
    expect(stdout).toBe("origin:main");
    expect(exitCode).toBe(0);
  });

  test("--force フラグを指定する", async () => {
    const { stdout } = await runCLI("remote", "origin", "push", "main", "--force");
    expect(stdout).toContain("origin:main");
    expect(stdout).toContain("force");
  });

  test("-f エイリアスで force を指定する", async () => {
    const { stdout } = await runCLI("remote", "origin", "push", "main", "-f");
    expect(stdout).toContain("force");
  });

  test("remote 単体でサブコマンド一覧を表示する", async () => {
    const { stdout, exitCode } = await runCLI("remote");
    expect(stdout).toContain("Available commands:");
    expect(stdout).toContain("<name>");
    expect(exitCode).toBe(0);
  });

  test("remote <name> 単体でサブコマンド一覧を表示する", async () => {
    const { stdout, exitCode } = await runCLI("remote", "origin");
    expect(stdout).toContain("Available commands:");
    expect(stdout).toContain("push");
    expect(exitCode).toBe(0);
  });

  test("remote <name> push で引数なしの場合はヘルプを表示する", async () => {
    const { stdout, exitCode } = await runCLI("remote", "origin", "push");
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("<branch>");
    expect(exitCode).toBe(0);
  });
});

// --- config ファイル ---

describe("config", () => {
  test("--config で config ファイルから値を読み込む", async () => {
    const { stdout, exitCode } = await runCLI("--config", CONFIG_PATH, "serve");
    expect(stdout).toBe("0.0.0.0:5000");
    expect(exitCode).toBe(0);
  });

  test("--config=path 記法で config ファイルから値を読み込む", async () => {
    const { stdout, exitCode } = await runCLI(`--config=${CONFIG_PATH}`, "serve");
    expect(stdout).toBe("0.0.0.0:5000");
    expect(exitCode).toBe(0);
  });

  test("-c 短縮形で config ファイルから値を読み込む", async () => {
    const { stdout, exitCode } = await runCLI("-c", CONFIG_PATH, "serve");
    expect(stdout).toBe("0.0.0.0:5000");
    expect(exitCode).toBe(0);
  });

  test("CLI フラグが config より優先される", async () => {
    const { stdout } = await runCLI("--config", CONFIG_PATH, "serve", "--port", "8080");
    expect(stdout).toBe("0.0.0.0:8080");
  });

  test("env が config より優先される", async () => {
    const { stdout } = await runCLIWithEnv(
      { TEST_SERVE_PORT: "9090" },
      "--config",
      CONFIG_PATH,
      "serve",
    );
    expect(stdout).toBe("0.0.0.0:9090");
  });
});

// --- defaultCommand ---

describe("defaultCommand", () => {
  test("引数なしでデフォルトコマンドを実行する", async () => {
    const { stdout, exitCode } = await runDefaultCLI();
    expect(stdout).toBe("localhost:3000");
    expect(exitCode).toBe(0);
  });

  test("フラグをデフォルトコマンドに渡す", async () => {
    const { stdout, exitCode } = await runDefaultCLI("--port", "8080");
    expect(stdout).toBe("localhost:8080");
    expect(exitCode).toBe(0);
  });

  test("デフォルトコマンドを直接指定しても通常通り動作する", async () => {
    const { stdout, exitCode } = await runDefaultCLI("serve");
    expect(stdout).toBe("localhost:3000");
    expect(exitCode).toBe(0);
  });

  test("デフォルトコマンドを直接指定してフラグを渡す", async () => {
    const { stdout, exitCode } = await runDefaultCLI("serve", "--port", "8080");
    expect(stdout).toBe("localhost:8080");
    expect(exitCode).toBe(0);
  });

  test("別コマンドの実行に影響しない", async () => {
    const { stdout, exitCode } = await runDefaultCLI("config", "set", "foo", "bar");
    expect(stdout).toBe("foo=bar");
    expect(exitCode).toBe(0);
  });

  test("未マッチのトークンはデフォルトコマンドにフォールバックする", async () => {
    // serve には positional 引数がないため、未マッチトークンは無視されデフォルト値で実行される
    const { stdout, exitCode } = await runDefaultCLI("nonexistent");
    expect(stdout).toBe("localhost:3000");
    expect(exitCode).toBe(0);
  });

  test("--help で統合ヘルプを表示する", async () => {
    const { stdout, exitCode } = await runDefaultCLI("--help");
    expect(stdout).toContain("Start the server");
    expect(stdout).toContain("--port");
    expect(stdout).toContain("--host");
    expect(stdout).toContain("Available commands:");
    expect(stdout).toContain("serve (default)");
    expect(stdout).toContain("config");
    expect(stdout).toContain("remote");
    expect(exitCode).toBe(0);
  });

  test("-h で統合ヘルプを表示する", async () => {
    const { stdout, exitCode } = await runDefaultCLI("-h");
    expect(stdout).toContain("Available commands:");
    expect(stdout).toContain("serve (default)");
    expect(exitCode).toBe(0);
  });

  test("serve --help は serve 固有のヘルプを表示する", async () => {
    const { stdout, exitCode } = await runDefaultCLI("serve", "--help");
    expect(stdout).toContain("Usage: test-cli serve");
    expect(stdout).not.toContain("Available commands:");
    expect(exitCode).toBe(0);
  });
});

// --- defaultCommand（positional 引数付き） ---

async function runDefaultPositionalCLI(
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", DEFAULT_COMMAND_POSITIONAL_ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

describe("defaultCommand with positional args", () => {
  test("未マッチのトークンをデフォルトコマンドの位置引数として渡す", async () => {
    const { stdout, exitCode } = await runDefaultPositionalCLI("/tmp/foo");
    expect(stdout).toBe("/tmp/foo");
    expect(exitCode).toBe(0);
  });

  test("引数なしでデフォルトコマンドを実行する", async () => {
    const { stdout, exitCode } = await runDefaultPositionalCLI();
    expect(stdout).toBe(".");
    expect(exitCode).toBe(0);
  });

  test("別コマンドの実行に影響しない", async () => {
    const { stdout, exitCode } = await runDefaultPositionalCLI("config", "set", "foo", "bar");
    expect(stdout).toBe("foo=bar");
    expect(exitCode).toBe(0);
  });
});

// --- version ---

async function runVersionCLI(
  entry: string,
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", entry, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

describe("version", () => {
  test("--version でバージョンを表示する", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_ENTRY, "--version");
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });

  test("-V でバージョンを表示する（デフォルトエイリアス）", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_ENTRY, "-V");
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });

  test("--help にバージョンフラグが表示される", async () => {
    const { stdout } = await runVersionCLI(VERSION_ENTRY, "serve", "--help");
    expect(stdout).toContain("-V, --version");
    expect(stdout).toContain("Show version");
  });

  test("version 未指定のエントリでは --version が無視される", async () => {
    const { stdout, exitCode } = await runCLI("--version");
    expect(stdout).toContain("Available commands:");
    expect(exitCode).toBe(0);
  });

  test("version 未指定のエントリでは -V が無視される", async () => {
    const { stdout, exitCode } = await runCLI("-V");
    expect(stdout).toContain("Available commands:");
    expect(exitCode).toBe(0);
  });

  test("version 未指定のエントリではヘルプに --version が表示されない", async () => {
    const { stdout } = await runCLI("serve", "--help");
    expect(stdout).not.toContain("--version");
  });
});

describe("version with alias: false", () => {
  test("--version でバージョンを表示する", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_NO_ALIAS_ENTRY, "--version");
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });

  test("-V が無効なのでサブコマンド一覧を表示する", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_NO_ALIAS_ENTRY, "-V");
    expect(stdout).toContain("Available commands:");
    expect(exitCode).toBe(0);
  });

  test("--help に --version が表示されるが -V は表示されない", async () => {
    const { stdout } = await runVersionCLI(VERSION_NO_ALIAS_ENTRY, "serve", "--help");
    expect(stdout).toContain("--version");
    expect(stdout).not.toContain("-V, --version");
  });
});

describe("version with custom alias", () => {
  test("-v でバージョンを表示する（カスタムエイリアス）", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_CUSTOM_ALIAS_ENTRY, "-v");
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });

  test("-V はカスタムエイリアスでは無効", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_CUSTOM_ALIAS_ENTRY, "-V");
    expect(stdout).toContain("Available commands:");
    expect(exitCode).toBe(0);
  });

  test("--help に -v, --version が表示される", async () => {
    const { stdout } = await runVersionCLI(VERSION_CUSTOM_ALIAS_ENTRY, "serve", "--help");
    expect(stdout).toContain("-v, --version");
  });
});

// --- version のスコープ（ルートレベルのみ有効） ---

describe("version scope", () => {
  test("サブコマンド後の --version はバージョンを表示しない", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_ENTRY, "serve", "--version");
    expect(stdout).not.toBe("1.2.3");
    expect(exitCode).not.toBe(0);
  });

  test("サブコマンド後の -V はバージョンを表示しない", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_ENTRY, "serve", "-V");
    expect(stdout).not.toBe("1.2.3");
    expect(exitCode).not.toBe(0);
  });

  test("存在しないコマンド + --version はバージョンを表示しない", async () => {
    const { stdout } = await runVersionCLI(VERSION_ENTRY, "nonexistent", "--version");
    expect(stdout).not.toBe("1.2.3");
    expect(stdout).toContain("Available commands:");
  });

  test("存在しないコマンド + -V はバージョンを表示しない", async () => {
    const { stdout } = await runVersionCLI(VERSION_ENTRY, "nonexistent", "-V");
    expect(stdout).not.toBe("1.2.3");
    expect(stdout).toContain("Available commands:");
  });

  test("--help と --version の同時指定では --version が優先される", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_ENTRY, "--help", "--version");
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });

  test("--version と --help の同時指定でも --version が優先される", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_ENTRY, "--version", "--help");
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });
});

// --- version + defaultCommand ---

describe("version with defaultCommand", () => {
  test("--version でバージョンを表示する", async () => {
    const { stdout, exitCode } = await runVersionCLI(VERSION_DEFAULT_COMMAND_ENTRY, "--version");
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });

  test("--help に --version が表示される", async () => {
    const { stdout } = await runVersionCLI(VERSION_DEFAULT_COMMAND_ENTRY, "--help");
    expect(stdout).toContain("-V, --version");
  });
});

// --- version + defaultCommand（positional-only） ---

describe("version with defaultCommand (positional-only)", () => {
  test("--version でバージョンを表示する", async () => {
    const { stdout, exitCode } = await runVersionCLI(
      VERSION_DEFAULT_COMMAND_POSITIONAL_ENTRY,
      "--version",
    );
    expect(stdout).toBe("1.2.3");
    expect(exitCode).toBe(0);
  });

  test("--help に --help と --version が表示される", async () => {
    const { stdout } = await runVersionCLI(VERSION_DEFAULT_COMMAND_POSITIONAL_ENTRY, "--help");
    expect(stdout).toContain("--help");
    expect(stdout).toContain("--version");
  });
});

// --- 引数なし実行時のヘルプ自動表示 ---

async function runRootIndexCLI(
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["bun", "run", ROOT_INDEX_ENTRY, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

describe("auto help on no args", () => {
  test("引数なしでヘルプを表示して正常終了する", async () => {
    const { stdout, stderr, exitCode } = await runRootIndexCLI();
    expect(stdout).toContain("Say hello");
    expect(stdout).toContain("Usage:");
    expect(stdout).toContain("<name>");
    expect(stderr).toBe("");
    expect(exitCode).toBe(0);
  });

  test("引数ありで正常に実行する", async () => {
    const { stdout, exitCode } = await runRootIndexCLI("world");
    expect(stdout).toBe("Hello, world");
    expect(exitCode).toBe(0);
  });

  test("-h でヘルプを表示する", async () => {
    const { stdout, exitCode } = await runRootIndexCLI("-h");
    expect(stdout).toContain("Usage:");
    expect(exitCode).toBe(0);
  });
});
