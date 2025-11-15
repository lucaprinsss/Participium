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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const app_1 = __importDefault(require("./app"));
const loggingService_1 = require("@services/loggingService");
const connection_1 = require("@database/connection");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const PORT = process.env.PORT || 3001;
let server;
async function startServer() {
    try {
        await connection_1.AppDataSource.initialize();
        server = app_1.default.listen(PORT, () => {
            loggingService_1.logger.info(`Server is running on port ${PORT}`);
            loggingService_1.logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
        });
    }
    catch (error) {
        loggingService_1.logger.error("Error during Data Source initialization:", error);
        process.exit(1);
    }
}
function closeServer() {
    return new Promise((resolve, reject) => {
        if (server) {
            server.close((err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        }
        else {
            resolve();
        }
    });
}
async function shutdown() {
    loggingService_1.logger.info("Shutting down server...");
    await closeServer();
    await (0, connection_1.closeDatabase)();
    loggingService_1.logger.info("Shutdown complete.");
    process.exit(0);
}
startServer();
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
