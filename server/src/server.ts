import "reflect-metadata";
import app from './app';
import http from 'http';
import { logger } from "@services/loggingService";
import { AppDataSource, closeDatabase } from "@database/connection";
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

let server: http.Server;

async function startServer() {
  try {
    await AppDataSource.initialize();
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Swagger UI available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Error during Data Source initialization:", error);
    process.exit(1);
  }
}

function closeServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function shutdown() {
  logger.info("Shutting down server...");

  await closeServer();
  await closeDatabase();

  logger.info("Shutdown complete.");
  process.exit(0);
}

startServer();

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);