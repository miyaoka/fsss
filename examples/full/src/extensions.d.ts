// このファイルは自動生成されます。手動で編集しないでください。
import type { LoggerExtensions } from "./commands/_plugins/logger";
import type { AuthExtensions } from "./commands/remote/_plugins/auth";

declare module "@miyaoka/fsss" {
  interface Extensions extends LoggerExtensions, AuthExtensions {}
}
