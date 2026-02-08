// コマンドパス + arg 名から env 名を自動導出する
// prefix + commandPath + argName を "_" で結合して大文字化
// 例: deriveEnvName("MYAPP", ["serve"], "port") → "MYAPP_SERVE_PORT"
// 例: deriveEnvName("MYAPP", [], "port") → "MYAPP_PORT"
function deriveEnvName(prefix: string, commandPath: string[], argName: string): string {
  const parts = [prefix, ...commandPath, argName];
  return parts.join("_").toUpperCase();
}

// コマンドパス + arg 名から config のドットパスを自動導出する
// commandPath + argName を "." で結合
// 例: deriveConfigPath(["serve"], "port") → "serve.port"
// 例: deriveConfigPath([], "port") → "port"
function deriveConfigPath(commandPath: string[], argName: string): string {
  const parts = [...commandPath, argName];
  return parts.join(".");
}

export { deriveConfigPath, deriveEnvName };
