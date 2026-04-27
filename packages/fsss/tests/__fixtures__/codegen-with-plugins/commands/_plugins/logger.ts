export interface LoggerExtension {
  logger: { info(msg: string): void };
}
