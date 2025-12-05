import "reflect-metadata";
import { DataSource, DefaultNamingStrategy, NamingStrategyInterface } from "typeorm";
import { snakeCase } from "typeorm/util/StringUtils";
import * as dotenv from 'dotenv';
import { logger } from "@services/loggingService";
import { CategoryRoleEntity } from "../models/entity/CategoryRoleEntity";

dotenv.config({ debug: false });

/**
 * Custom naming strategy that converts camelCase property names to snake_case column names
 */
class SnakeCaseNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return customName || snakeCase(embeddedPrefixes.concat(propertyName).join("_"));
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName);
  }
}

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number.parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [
      CategoryRoleEntity,
      __dirname + '/../models/entity/**/*.{ts,js}'],
    migrations: [],
    subscribers: [],
    namingStrategy: new SnakeCaseNamingStrategy(),
});

export async function closeDatabase() {
  try {
    await AppDataSource.destroy();
    logger.info("Database connection closed.");
  } catch (error) {
    logger.info("Error while closing database:", error);
  }
}