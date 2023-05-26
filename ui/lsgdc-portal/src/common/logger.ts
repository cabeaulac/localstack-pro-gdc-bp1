export type LogLevel = "NONE" | "ERROR" | "WARN" | "INFO" | "DEBUG";

const LogLevelToValue: Record<LogLevel, number> = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
};

/***
 * General purpose console logger
 */
export class Logger {
  /***
   * Create new logger instance
   * @param logThreshold sets the threshold for if a message gets logged to console. Defaults to INFO
   * @param prefix sets log msg prefix
   */
  public constructor(
    public logThreshold: LogLevel = "INFO",
    public prefix: string = ""
  ) {}

  /***
   * Log message to console if specified logLevel is at or above the loggers level
   * @param logLevel the level of the message to log
   * @param msg message and or data to log
   */
  public logIt(logLevel: LogLevel, ...msg: any): void {
    if (
      !msg ||
      LogLevelToValue[this.logThreshold] < LogLevelToValue[logLevel]
    ) {
      return;
    }
    if (this.prefix) {
      msg.unshift(this.prefix);
    }
    // @ts-ignore
    console[logLevel.toLowerCase()](...msg);
  }

  /***
   * Calls logIt method with ERROR Log level
   * @param msg message and or data to log
   */
  public logError(...msg: any): void {
    this.logIt("ERROR", ...msg);
  }

  /***
   * Calls logIt method with WARN Log level
   * @param msg message and or data to log
   */
  public logWarn(...msg: any): void {
    this.logIt("WARN", ...msg);
  }

  /***
   * Calls logIt method with INFO Log level
   * @param msg message and or data to log
   */
  public logInfo(...msg: any): void {
    this.logIt("INFO", ...msg);
  }

  /***
   * Calls logIt method with DEBUG Log level
   * @param msg message and or data to log
   */
  public logDebug(...msg: any): void {
    this.logIt("DEBUG", ...msg);
  }
}

// export default new Logger(process.env.VUE_APP_LOGGING_LEVEL);
export default new Logger("DEBUG");
