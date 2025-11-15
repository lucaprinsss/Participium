"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.closeDatabase = closeDatabase;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const StringUtils_1 = require("typeorm/util/StringUtils");
const dotenv = __importStar(require("dotenv"));
const loggingService_1 = require("@services/loggingService");
dotenv.config();
/**
 * Custom naming strategy that converts camelCase property names to snake_case column names
 */
class SnakeCaseNamingStrategy extends typeorm_1.DefaultNamingStrategy {
    columnName(propertyName, customName, embeddedPrefixes) {
        return customName || (0, StringUtils_1.snakeCase)(embeddedPrefixes.concat(propertyName).join("_"));
    }
    relationName(propertyName) {
        return (0, StringUtils_1.snakeCase)(propertyName);
    }
}
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: process.env.NODE_ENV === 'development', // true just for development
    logging: false,
    entities: [__dirname + '/../models/entity/**/*.ts'],
    migrations: [],
    subscribers: [],
    namingStrategy: new SnakeCaseNamingStrategy(),
});
async function closeDatabase() {
    try {
        await exports.AppDataSource.destroy();
        loggingService_1.logger.info("Database connection closed.");
    }
    catch (error) {
        loggingService_1.logger.info("Error while closing database:", error);
    }
}
