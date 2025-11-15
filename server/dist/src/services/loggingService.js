"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logError = exports.logWarn = exports.logInfo = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)),
    transports: [
        new winston_1.default.transports.Console()
    ]
});
const logInfo = (message) => exports.logger.info(message);
exports.logInfo = logInfo;
const logWarn = (message) => exports.logger.warn(message);
exports.logWarn = logWarn;
const logError = (message, error) => exports.logger.error(`${message} ${error ? `\nStack: ${error.stack}` : ""}`);
exports.logError = logError;
const logDebug = (message) => exports.logger.debug(message);
exports.logDebug = logDebug;
