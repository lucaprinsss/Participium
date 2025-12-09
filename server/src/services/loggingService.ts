import winston from "winston";

// Disabilita completamente i log durante i test
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.argv.some(arg => arg.includes('test'));

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
  ],
  silent: isTestEnvironment
});

export const logInfo = (message: string) => logger.info(message);
export const logWarn = (message: string) => logger.warn(message);
export const logError = (message: string, error?: any) => {
  const stackTrace = error ? `\nStack: ${error.stack}` : "";
  logger.error(`${message} ${stackTrace}`);
};
export const logDebug = (message: string) => logger.debug(message);
