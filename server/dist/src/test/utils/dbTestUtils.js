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
exports.loadTestEnvironment = loadTestEnvironment;
exports.cleanDatabase = cleanDatabase;
exports.cleanDatabaseCompletely = cleanDatabaseCompletely;
exports.resetSequences = resetSequences;
exports.setupTestDatabase = setupTestDatabase;
exports.teardownTestDatabase = teardownTestDatabase;
exports.ensureTestDatabase = ensureTestDatabase;
const connection_1 = require("@database/connection");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
/**
 * Carica configurazione ambiente di test
 */
function loadTestEnvironment() {
    if (process.env.NODE_ENV === 'test') {
        const envPath = path.resolve(__dirname, '../../../.env.test');
        dotenv.config({ path: envPath, override: true });
        console.log('Test environment loaded from .env.test');
    }
}
/**
 * Pulisce tutte le tabelle del database di test
 * Mantiene i dati iniziali inseriti da test-data.sql
 */
async function cleanDatabase() {
    const queryRunner = connection_1.AppDataSource.createQueryRunner();
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
        await queryRunner.query('DELETE FROM users WHERE username NOT IN ($1, $2, $3, $4);', ['testcitizen', 'testmunicipality', 'testadmin', 'testuser_nonotif']);
        // Riabilita constraints
        await queryRunner.query('SET session_replication_role = DEFAULT;');
        await queryRunner.commitTransaction();
    }
    catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    }
    finally {
        await queryRunner.release();
    }
}
/**
 * Pulisce completamente il database (inclusi dati di test base)
 */
async function cleanDatabaseCompletely() {
    const queryRunner = connection_1.AppDataSource.createQueryRunner();
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
    }
    catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    }
    finally {
        await queryRunner.release();
    }
}
/**
 * Resetta le sequence AUTO_INCREMENT
 */
async function resetSequences() {
    const entities = connection_1.AppDataSource.entityMetadatas;
    for (const entity of entities) {
        if (entity.tableName) {
            try {
                await connection_1.AppDataSource.query(`SELECT setval(pg_get_serial_sequence('${entity.tableName}', 'id'), COALESCE(MAX(id), 1)) FROM ${entity.tableName};`);
            }
            catch (error) {
                // Ignora errori per tabelle senza sequence
            }
        }
    }
}
/**
 * Setup completo database di test
 */
async function setupTestDatabase() {
    loadTestEnvironment();
    if (!connection_1.AppDataSource.isInitialized) {
        try {
            await connection_1.AppDataSource.initialize();
            console.log('Test database connected successfully');
            // Verifica connessione con una query semplice
            const result = await connection_1.AppDataSource.query('SELECT NOW()');
            console.log('Database connection verified:', result[0]);
        }
        catch (error) {
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
async function teardownTestDatabase() {
    if (connection_1.AppDataSource.isInitialized) {
        await connection_1.AppDataSource.destroy();
        console.log('Test database disconnected');
    }
}
/**
 * Verifica che siamo connessi al database di test
 */
async function ensureTestDatabase() {
    const dbName = process.env.DB_NAME;
    if (dbName !== 'participium_db_test') {
        throw new Error(`DANGER: Not connected to test database! Current: ${dbName}\n` +
            `Please set NODE_ENV=test and use .env.test configuration.`);
    }
    console.log('Verified: Connected to test database');
}
