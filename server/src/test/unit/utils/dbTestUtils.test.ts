import { AppDataSource } from '../../../database/connection';
import * as dotenv from 'dotenv';
import * as path from 'node:path';
import {
  loadTestEnvironment,
  cleanDatabase,
  cleanDatabaseCompletely,
  resetSequences,
  setupTestDatabase,
  teardownTestDatabase,
  ensureTestDatabase,
} from '../../../test/utils/dbTestUtils';

jest.mock('../../../database/connection');
jest.mock('dotenv');
jest.mock('node:path', () => ({
  resolve: jest.fn().mockReturnValue('/mock/path/.env.test'),
}));
jest.mock('app-root-path', () => ({
  path: '/mock/root/path'
}));

describe('dbTestUtils', () => {
  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    query: jest.fn(),
  };

  const mockAppDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    isInitialized: false,
    initialize: jest.fn(),
    destroy: jest.fn(),
    query: jest.fn(),
    entityMetadatas: [
      { tableName: 'users' },
      { tableName: 'reports' },
      { tableName: null },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AppDataSource as any) = mockAppDataSource;
    delete process.env.NODE_ENV;
  });

  describe('loadTestEnvironment', () => {
    it('should load test environment when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';

      loadTestEnvironment();

      expect(dotenv.config).toHaveBeenCalledWith({
        path: expect.any(String),
        override: true,
        debug: false,
      });
    });

    it('should not load test environment when NODE_ENV is not test', () => {
      process.env.NODE_ENV = 'development';

      loadTestEnvironment();

      expect(dotenv.config).not.toHaveBeenCalled();
    });
  });

  describe('cleanDatabase', () => {
    it('should clean database tables successfully', async () => {
      mockQueryRunner.query.mockResolvedValue(undefined);

      await cleanDatabase();

      expect(mockAppDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.query).toHaveBeenCalledWith('SET session_replication_role = replica;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE reports CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE comments CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE photos CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE notifications CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE messages CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        'DELETE FROM users WHERE username NOT IN ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);',
        expect.any(Array)
      );
      expect(mockQueryRunner.query).toHaveBeenCalledWith('SET session_replication_role = DEFAULT;');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Database error');
      mockQueryRunner.query.mockRejectedValueOnce(error);

      await expect(cleanDatabase()).rejects.toThrow('Database error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('cleanDatabaseCompletely', () => {
    it('should clean all database tables', async () => {
      mockQueryRunner.query.mockResolvedValue(undefined);

      await cleanDatabaseCompletely();

      expect(mockAppDataSource.createQueryRunner).toHaveBeenCalled();
      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.query).toHaveBeenCalledWith('SET session_replication_role = replica;');

      // Check that all tables are truncated
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE notifications CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE messages CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE comments CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE photos CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE reports CASCADE;');
      expect(mockQueryRunner.query).toHaveBeenCalledWith('TRUNCATE TABLE users CASCADE;');

      expect(mockQueryRunner.query).toHaveBeenCalledWith('SET session_replication_role = DEFAULT;');
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const error = new Error('Database error');
      mockQueryRunner.query.mockRejectedValueOnce(error);

      await expect(cleanDatabaseCompletely()).rejects.toThrow('Database error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('resetSequences', () => {
    it('should reset sequences for all entities with table names', async () => {
      mockAppDataSource.query.mockResolvedValue(undefined);

      await resetSequences();

      expect(mockAppDataSource.query).toHaveBeenCalledTimes(2); // Two entities with table names
      expect(mockAppDataSource.query).toHaveBeenCalledWith(
        "SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(MAX(id), 1)) FROM users;"
      );
      expect(mockAppDataSource.query).toHaveBeenCalledWith(
        "SELECT setval(pg_get_serial_sequence('reports', 'id'), COALESCE(MAX(id), 1)) FROM reports;"
      );
    });

    it('should skip entities without table names', async () => {
      await resetSequences();

      expect(mockAppDataSource.query).toHaveBeenCalledTimes(2); // Only entities with table names
    });
  });

  describe('setupTestDatabase', () => {
    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      (console.log as jest.Mock).mockRestore();
      (console.error as jest.Mock).mockRestore();
    });

    it('should setup test database successfully', async () => {
      mockAppDataSource.isInitialized = false;
      mockAppDataSource.initialize.mockResolvedValue(undefined);
      mockAppDataSource.query.mockResolvedValue([{ now: new Date() }]);

      await setupTestDatabase();

      expect(mockAppDataSource.initialize).toHaveBeenCalled();
      expect(mockAppDataSource.query).toHaveBeenCalledWith('SELECT NOW()');
      expect(console.log).toHaveBeenCalledWith('Test database connected successfully');
      expect(console.log).toHaveBeenCalledWith('Test database ready');
    });

    it('should not initialize if already initialized', async () => {
      mockAppDataSource.isInitialized = true;

      await setupTestDatabase();

      expect(mockAppDataSource.initialize).not.toHaveBeenCalled();
    });

    it('should throw error on database initialization failure', async () => {
      const error = new Error('Connection failed');
      mockAppDataSource.isInitialized = false;
      mockAppDataSource.initialize.mockRejectedValue(error);

      await expect(setupTestDatabase()).rejects.toThrow('Connection failed');

      expect(console.error).toHaveBeenCalledWith('Failed to connect to test database:', error);
    });
  });

  describe('teardownTestDatabase', () => {
    it('should destroy database connection if initialized', async () => {
      mockAppDataSource.isInitialized = true;
      mockAppDataSource.destroy.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await teardownTestDatabase();

      expect(mockAppDataSource.destroy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Test database disconnected');

      consoleSpy.mockRestore();
    });

    it('should not destroy if not initialized', async () => {
      mockAppDataSource.isInitialized = false;

      await teardownTestDatabase();

      expect(mockAppDataSource.destroy).not.toHaveBeenCalled();
    });
  });

  describe('ensureTestDatabase', () => {
    it('should verify test database connection', async () => {
      process.env.DB_NAME = 'participium_db_test';

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await ensureTestDatabase();

      expect(consoleSpy).toHaveBeenCalledWith('Verified: Connected to test database');

      consoleSpy.mockRestore();
    });

    it('should throw error if not connected to test database', async () => {
      process.env.DB_NAME = 'participium_db_prod';

      await expect(ensureTestDatabase()).rejects.toThrow(
        'DANGER: Not connected to test database! Current: participium_db_prod'
      );
    });
  });
});