import { AppDataSource, closeDatabase } from '@database/connection';
import { SnakeCaseNamingStrategy } from '@database/connection';

// Mock logger
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerDebug = jest.fn();

jest.mock('@services/loggingService', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

// Mock AppDataSource
jest.mock('typeorm', () => ({
    ...jest.requireActual('typeorm'),
    DataSource: jest.fn().mockImplementation(() => ({
        destroy: jest.fn(),
    })),
}));

const mockDestroy = jest.fn();
AppDataSource.destroy = mockDestroy;

// Import the mocked logger
import { logger as mockLogger } from '@services/loggingService';

describe('connection.ts', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('SnakeCaseNamingStrategy', () => {
        it('should convert property name to snake_case if customName is not provided', () => {
            const strategy = new SnakeCaseNamingStrategy();
            const propertyName = 'myPropertyName';
            const embeddedPrefixes: string[] = [];
            const customName = undefined;

            const result = strategy.columnName(propertyName, customName!, embeddedPrefixes);
            expect(result).toBe('my_property_name');
        });

        it('should use customName if provided', () => {
            const strategy = new SnakeCaseNamingStrategy();
            const propertyName = 'myPropertyName';
            const embeddedPrefixes: string[] = [];
            const customName = 'custom_name_column';

            const result = strategy.columnName(propertyName, customName, embeddedPrefixes);
            expect(result).toBe('custom_name_column');
        });

        it('should handle embedded prefixes correctly', () => {
            const strategy = new SnakeCaseNamingStrategy();
            const propertyName = 'id';
            const embeddedPrefixes = ['user', 'address'];
            const customName = undefined;

            const result = strategy.columnName(propertyName, customName!, embeddedPrefixes);
            expect(result).toBe('user_address_id');
        });

        it('should convert relation name to snake_case', () => {
            const strategy = new SnakeCaseNamingStrategy();
            const propertyName = 'myRelationName';
            const result = strategy.relationName(propertyName);
            expect(result).toBe('my_relation_name');
        });
    });

    describe('closeDatabase', () => {
        it('should close the database connection and log success', async () => {
            mockDestroy.mockResolvedValueOnce(undefined);

            await closeDatabase();

            expect(mockDestroy).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith('Database connection closed.');
            expect(mockLogger.info).not.toHaveBeenCalledWith(expect.stringContaining('Error while closing database:'), expect.any(Error));
        });

        it('should log an error if closing the database fails', async () => {
            const mockError = new Error('Failed to destroy connection');
            mockDestroy.mockRejectedValueOnce(mockError);

            await closeDatabase();

            expect(mockDestroy).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Error while closing database:'), mockError);
            expect(mockLogger.info).not.toHaveBeenCalledWith('Database connection closed.');
        });
    });
});
