import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

const ENTRY = resolve(import.meta.dirname, "__fixtures__/cli-entry.ts");

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

  test("環境変数 PORT から値を取得する", async () => {
    const { stdout } = await runCLIWithEnv({ PORT: "9090" }, "serve");
    expect(stdout).toBe("localhost:9090");
  });

  test("CLI フラグが環境変数より優先される", async () => {
    const { stdout } = await runCLIWithEnv({ PORT: "9090" }, "serve", "--port", "4000");
    expect(stdout).toBe("localhost:4000");
  });

  test("--help でヘルプを表示する", async () => {
    const { stdout, exitCode } = await runCLI("serve", "--help");
    expect(stdout).toContain("サーバーを起動する");
    expect(stdout).toContain("Usage: test-cli serve");
    expect(stdout).toContain("--port");
    expect(stdout).toContain("--host");
    expect(stdout).toContain("--verbose");
    expect(stdout).toContain("--help");
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

  test("config set で引数不足時にエラーヘルプを表示する", async () => {
    const { stderr, exitCode } = await runCLI("config", "set");
    expect(stderr).toContain("Error:");
    expect(stderr).toContain("Usage:");
    expect(exitCode).toBe(1);
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

  test("remote <name> push で引数不足時にエラーヘルプを表示する", async () => {
    const { stderr, exitCode } = await runCLI("remote", "origin", "push");
    expect(stderr).toContain("Error:");
    expect(stderr).toContain("branch");
    expect(exitCode).toBe(1);
  });
});
