"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapperService_1 = require("../../../services/mapperService");
const mockEntities_1 = require("@test/utils/mockEntities");
describe('Mapper Service', () => {
    describe('mapUserEntityToUserResponse', () => {
        it('should return null if the entity is null', () => {
            // Act
            const result = (0, mapperService_1.mapUserEntityToUserResponse)(null);
            // Assert
            expect(result).toBeNull();
        });
        it('should return null if the entity is undefined', () => {
            // Act
            const result = (0, mapperService_1.mapUserEntityToUserResponse)(undefined);
            // Assert
            expect(result).toBeNull();
        });
        it('should correctly map a userEntity to a UserResponse', () => {
            // Arrange
            const mockEntity = (0, mockEntities_1.createMockMunicipalityUser)('Administrator', 'Administration', {
                id: 123,
                username: 'testuser',
                email: 'test@example.com',
                firstName: 'Mario',
                lastName: 'Rossi',
                telegramUsername: 'tele_user',
            });
            mockEntity.passwordHash = 'hash_segreto';
            const expectedResponse = {
                id: 123,
                username: 'testuser',
                email: 'test@example.com',
                first_name: 'Mario',
                last_name: 'Rossi',
                role_name: 'Administrator',
                department_name: 'Administration',
            };
            // Act
            const result = (0, mapperService_1.mapUserEntityToUserResponse)(mockEntity);
            // Assert
            expect(result).toEqual(expectedResponse);
            expect(result).not.toHaveProperty('passwordHash');
            expect(result).not.toHaveProperty('createdAt');
            expect(result).not.toHaveProperty('telegramUsername');
        });
    });
    describe('createErrorDTO', () => {
        it('should create a full ErrorDTO with all properties', () => {
            // Arrange
            const expectedDTO = {
                code: 404,
                name: 'NotFound',
                message: 'Resource not found',
            };
            // Act
            const result = (0, mapperService_1.createErrorDTO)(404, 'Resource not found', 'NotFound');
            // Assert
            expect(result).toEqual(expectedDTO);
        });
        it('should filter out undefined optional properties', () => {
            // Arrange
            const expectedDTO = {
                code: 500,
            };
            // Act
            const result = (0, mapperService_1.createErrorDTO)(500);
            // Assert
            expect(result).toEqual(expectedDTO);
            expect(result).not.toHaveProperty('name');
            expect(result).not.toHaveProperty('message');
        });
        it('should filter out null optional properties', () => {
            // Arrange
            const expectedDTO = {
                code: 401,
                name: 'AuthError',
            };
            // Act
            const result = (0, mapperService_1.createErrorDTO)(401, null, 'AuthError');
            // Assert
            expect(result).toEqual(expectedDTO);
            expect(result).not.toHaveProperty('message');
        });
    });
});
