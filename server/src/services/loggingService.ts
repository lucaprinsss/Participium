import winston from "winston";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ level, message, timestamp }) =>
        `[${timestamp}] ${level.toUpperCase()}: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console()
  ]
});

export const logInfo = (message: string) => logger.info(message);
export const logWarn = (message: string) => logger.warn(message);
export const logError = (message: string, error?: any) =>
  logger.error(`${message} ${error ? `\nStack: ${error.stack}` : ""}`);
export const logDebug = (message: string) => logger.debug(message);
