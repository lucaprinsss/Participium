import { AppDataSource } from '@database/connection';
import * as dotenv from 'dotenv';
import * as path from 'node:path';

/**
 * Loads test environment configuration from .env.test
 */
export function loadTestEnvironment(): void {
  if (process.env.NODE_ENV === 'test') {
    const envPath = path.resolve(__dirname, '../../../.env.test');
    dotenv.config({ path: envPath, override: true, debug: false });
  }
}

/**
 * Cleans only tables that can be modified by tests
 * Keeps base test data added from test-data.sql
 */
export async function cleanDatabase(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.query('SET session_replication_role = replica;');

    await queryRunner.query('TRUNCATE TABLE reports CASCADE;');
    await queryRunner.query('TRUNCATE TABLE comments CASCADE;');
    await queryRunner.query('TRUNCATE TABLE photos CASCADE;');
    await queryRunner.query('TRUNCATE TABLE notifications CASCADE;');
    await queryRunner.query('TRUNCATE TABLE messages CASCADE;');

    // Clean only users created during tests (not those from test-data.sql)
    await queryRunner.query(
      'DELETE FROM users WHERE username NOT IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);',
      [
        'testcitizen',
        'testmunicipality',
        'testadmin',
        'testuser_nonotif',
        'teststaffmember',
        'testroadstaff',
        'testsewerstaff',
        'testpro',
        'testexternal',
        'testexternal2',
        'testexternal3',
        'testexternal4'
      ]
    );

    await queryRunner.query('SET session_replication_role = DEFAULT;');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Completely cleans the database (including base test data)
 */
export async function cleanDatabaseCompletely(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.query('SET session_replication_role = replica;');

    const tables = [
      'notifications',
      'messages',
      'comments',
      'photos',
      'reports',
      'users',
    ];

    for (const table of tables) {
      await queryRunner.query(`TRUNCATE TABLE ${table} CASCADE;`);
    }

    await queryRunner.query('SET session_replication_role = DEFAULT;');

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Reset the AUTO_INCREMENT sequences
 */
export async function resetSequences(): Promise<void> {
  const entities = AppDataSource.entityMetadatas;

  for (const entity of entities) {
    if (entity.tableName) {
      await AppDataSource.query(
        `SELECT setval(pg_get_serial_sequence('${entity.tableName}', 'id'), COALESCE(MAX(id), 1)) FROM ${entity.tableName};`
      );
    }
  }
}

/**
 * Loads test data from test-data.sql
 */
export async function loadTestData(): Promise<void> {
  console.log('Loading test data from test-data.sql...');
  try {
    const fs = await import('node:fs/promises');
    const testDataPath = path.resolve(__dirname, '../../database/test-data.sql');
    const sql = await fs.readFile(testDataPath, 'utf8');

    // Execute SQL file
    await AppDataSource.query(sql);
    console.log('Test data loaded successfully');
  } catch (error) {
    console.error('Failed to load test data:', error);
    throw error;
  }
}

/**
 * Complete setup of the test database
 */
export async function setupTestDatabase(): Promise<void> {
  loadTestEnvironment();

  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('Test database connected successfully');

      // Verify connection with a simple query
      const result = await AppDataSource.query('SELECT NOW()');
      console.log('Database connection verified:', result[0]);
    } catch (error) {
      console.error('Failed to connect to test database:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
      throw error;
    }
  }

  // Check if test users exist - if not, load test data
  const testUsers = await AppDataSource.query(
    "SELECT COUNT(*) as count FROM users WHERE username = 'testcitizen'"
  );

  if (testUsers[0].count === '0') {
    await loadTestData();
  } else {
    console.log('Test data already loaded');
  }

  console.log('Test database ready');
}

/**
 * Teardown test database
 */
export async function teardownTestDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Test database disconnected');
  }
}

/**
 * Verifies that we are connected to the test database
 */
export async function ensureTestDatabase(): Promise<void> {
  const dbName = process.env.DB_NAME;

  if (dbName !== 'participium_db_test') {
    throw new Error(
      `DANGER: Not connected to test database! Current: ${dbName}\n` +
      `Please set NODE_ENV=test and use .env.test configuration.`
    );
  }

  console.log('Verified: Connected to test database');
}