import { AppDataSource } from '@database/connection';
import * as dotenv from 'dotenv';
import * as path from 'path';

/**
 * Carica configurazione ambiente di test
 */
export function loadTestEnvironment(): void {
  if (process.env.NODE_ENV === 'test') {
    const envPath = path.resolve(__dirname, '../../../.env.test');
    dotenv.config({ path: envPath, override: true, debug: false });
  }
}

/**
 * Pulisce tutte le tabelle del database di test
 * Mantiene i dati iniziali inseriti da test-data.sql
 */
export async function cleanDatabase(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Disabilita constraints temporaneamente
    await queryRunner.query('SET session_replication_role = replica;');

    // Pulisci solo le tabelle che possono essere modificate dai test
    // NON pulire le tabelle con dati di test base
    await queryRunner.query('TRUNCATE TABLE reports CASCADE;');
    await queryRunner.query('TRUNCATE TABLE comments CASCADE;');
    await queryRunner.query('TRUNCATE TABLE photos CASCADE;');
    await queryRunner.query('TRUNCATE TABLE notifications CASCADE;');
    await queryRunner.query('TRUNCATE TABLE messages CASCADE;');
    
    // Pulisci solo utenti creati durante i test (non quelli di test-data.sql)
await queryRunner.query(
  'DELETE FROM users WHERE username NOT IN ($1, $2, $3, $4, $5);',
  ['testcitizen', 'testmunicipality', 'testadmin', 'testuser_nonotif', 'teststaffmember']
);

    // Riabilita constraints
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
 * Pulisce completamente il database (inclusi dati di test base)
 */
export async function cleanDatabaseCompletely(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();
  
  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    await queryRunner.query('SET session_replication_role = replica;');
    
    // Pulisci TUTTE le tabelle
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
 * Resetta le sequence AUTO_INCREMENT
 */
export async function resetSequences(): Promise<void> {
  const entities = AppDataSource.entityMetadatas;

  for (const entity of entities) {
    if (entity.tableName) {
      try {
        await AppDataSource.query(
          `SELECT setval(pg_get_serial_sequence('${entity.tableName}', 'id'), COALESCE(MAX(id), 1)) FROM ${entity.tableName};`
        );
      } catch (error) {
        // Ignora errori per tabelle senza sequence
      }
    }
  }
}

/**
 * Setup completo database di test
 */
export async function setupTestDatabase(): Promise<void> {
  loadTestEnvironment();

  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      console.log('Test database connected successfully');
      
      // Verifica connessione con una query semplice
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

  // Non pulire: i dati di test sono già presenti da test-data.sql
  console.log('Test database ready');
}

/**
 * Teardown database di test
 */
export async function teardownTestDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('Test database disconnected');
  }
}

/**
 * Verifica che siamo connessi al database di test
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