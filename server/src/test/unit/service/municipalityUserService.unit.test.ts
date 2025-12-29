import { municipalityUserService } from '@services/municipalityUserService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { BadRequestError } from '@models/errors/BadRequestError';
import { ConflictError } from '@models/errors/ConflictError';
import { NotFoundError } from '@models/errors/NotFoundError';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { UserEntity } from '@models/entity/userEntity';

jest.mock('@repositories/userRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@repositories/companyRepository');
jest.mock('@services/loggingService');
jest.mock('@services/mapperService');

// Mock AppDataSource for direct query builder operations
const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
};

jest.mock('@database/connection', () => ({
    AppDataSource: {
        createQueryBuilder: jest.fn(() => mockQueryBuilder),
        getRepository: jest.fn(() => ({
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        })),
    },
}));

/**
 * Helper to create a mock user with userRoles array (V5.0 multi-role support)
 */
const createMockUserWithRoles = (
    roles: Array<{ roleName: string; departmentName: string }>,
    overrides?: Partial<UserEntity>
): any => {
    const user = {
        id: overrides?.id || 1,
        username: overrides?.username || 'testuser',
        email: overrides?.email || 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        userRoles: roles.map((role, index) => ({
            id: index + 1,
            userId: overrides?.id || 1,
            departmentRoleId: index + 1,
            departmentRole: {
                id: index + 1,
                departmentId: index + 1,
                roleId: index + 1,
                department: { id: index + 1, name: role.departmentName, departmentRoles: [] },
                role: { id: index + 1, name: role.roleName, description: '', departmentRoles: [] },
                userRoles: []
            },
            createdAt: new Date()
        })),
        ...overrides
    };
    return user;
};

describe('MunicipalityUserService', () => {
    const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
    const mockDepartmentRoleRepository = departmentRoleRepository as jest.Mocked<typeof departmentRoleRepository>;
    const mockCompanyRepository = companyRepository as jest.Mocked<typeof companyRepository>;
    const mockLogInfo = logInfo as jest.Mock;
    const mockMapUserEntityToUserResponse = mapUserEntityToUserResponse as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createMunicipalityUser', () => {
        // V5.0: Updated to use department_role_ids instead of role_name/department_name
        const registerData: RegisterRequest = {
            password: 'password123',
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
            email: 'john.doe@example.com',
            department_role_ids: [1], // V5.0: Array of department role IDs
        };

        it('should create a municipality user successfully', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            // findById is called per-ID, mock to return single object
            mockDepartmentRoleRepository.findById.mockResolvedValue(
                { id: 1, departmentId: 1, roleId: 1, department: { id: 1, name: 'Public Works', departmentRoles: [] }, role: { id: 1, name: 'Municipal Officer', description: '', departmentRoles: [] }, userRoles: [] } as any
            );
            mockUserRepository.createUserWithPassword.mockResolvedValue({ id: 1, ...registerData } as any);
            mockUserRepository.findUserById.mockResolvedValue(
                createMockUserWithRoles([{ roleName: 'Municipal Officer', departmentName: 'Public Works' }], { id: 1, username: 'johndoe' })
            );
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1, username: 'johndoe', roles: [] } as any);

            const result = await municipalityUserService.createMunicipalityUser(registerData);

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(mockLogInfo).toHaveBeenCalled();
        });

        it('should throw BadRequestError when department_role_ids is empty', async () => {
            const data = { ...registerData, department_role_ids: [] };
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when department_role_ids is missing', async () => {
            const data = { ...registerData, department_role_ids: undefined };
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow(BadRequestError);
        });

        it('should throw ConflictError if username already exists', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(true);
            await expect(municipalityUserService.createMunicipalityUser(registerData)).rejects.toThrow(ConflictError);
        });

        it('should throw ConflictError if email already exists', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(true);
            await expect(municipalityUserService.createMunicipalityUser(registerData)).rejects.toThrow(ConflictError);
        });

        it('should throw BadRequestError if one or more department roles are invalid', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            // findById returns null when role not found
            mockDepartmentRoleRepository.findById.mockResolvedValue(null);
            await expect(municipalityUserService.createMunicipalityUser(registerData)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError if trying to assign Citizen role', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockDepartmentRoleRepository.findById.mockResolvedValue(
                { id: 1, departmentId: 1, roleId: 1, department: { id: 1, name: 'Organization', departmentRoles: [] }, role: { id: 1, name: 'Citizen', description: '', departmentRoles: [] }, userRoles: [] } as any
            );
            await expect(municipalityUserService.createMunicipalityUser(registerData)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError if trying to assign Administrator role', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockDepartmentRoleRepository.findById.mockResolvedValue(
                { id: 1, departmentId: 1, roleId: 1, department: { id: 1, name: 'Organization', departmentRoles: [] }, role: { id: 1, name: 'Administrator', description: '', departmentRoles: [] }, userRoles: [] } as any
            );
            await expect(municipalityUserService.createMunicipalityUser(registerData)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError if External Maintainer has no company', async () => {
            const data = { ...registerData, company_name: undefined };
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockDepartmentRoleRepository.findById.mockResolvedValue(
                { id: 1, departmentId: 1, roleId: 1, department: { id: 1, name: 'External Service Providers', departmentRoles: [] }, role: { id: 1, name: 'External Maintainer', description: '', departmentRoles: [] }, userRoles: [] } as any
            );
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow('External Maintainer role requires a company assignment');
        });

        it('should throw BadRequestError if non-External Maintainer has company', async () => {
            const data = { ...registerData, company_name: 'Acme Corp' };
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockDepartmentRoleRepository.findById.mockResolvedValue(
                { id: 1, departmentId: 1, roleId: 1, department: { id: 1, name: 'Public Works', departmentRoles: [] }, role: { id: 1, name: 'Municipal Officer', description: '', departmentRoles: [] }, userRoles: [] } as any
            );
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow('Only External Maintainer role can be assigned to a company');
        });
    });

    describe('getAllMunicipalityUsers', () => {
        it('should return a list of municipality users', async () => {
            const mockUsers = [
                createMockUserWithRoles([{ roleName: 'Municipal Officer', departmentName: 'Public Works' }], { id: 1, username: 'user1' }),
                createMockUserWithRoles([{ roleName: 'Staff Member', departmentName: 'Water Services' }], { id: 2, username: 'user2' }),
            ];
            mockUserRepository.findUsersExcludingRoles.mockResolvedValue(mockUsers);
            mockMapUserEntityToUserResponse.mockImplementation(user => ({ id: user.id, username: user.username, roles: [] }));

            const result = await municipalityUserService.getAllMunicipalityUsers();

            expect(result).toHaveLength(2);
            expect(mockUserRepository.findUsersExcludingRoles).toHaveBeenCalledWith(['Citizen', 'Administrator']);
            expect(mockLogInfo).toHaveBeenCalled();
        });
    });

    describe('getMunicipalityUserById', () => {
        it('should return a user when found', async () => {
            const user = createMockUserWithRoles([{ roleName: 'Municipal Officer', departmentName: 'Public Works' }]);
            mockUserRepository.findUserById.mockResolvedValue(user);
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1, roles: [{ role_name: 'Municipal Officer' }] } as any);

            const result = await municipalityUserService.getMunicipalityUserById(1);

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(mockUserRepository.findUserById).toHaveBeenCalledWith(1);
        });

        it('should throw NotFoundError if user not found', async () => {
            mockUserRepository.findUserById.mockResolvedValue(null);

            await expect(municipalityUserService.getMunicipalityUserById(1)).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for a Citizen role', async () => {
            const user = createMockUserWithRoles([{ roleName: 'Citizen', departmentName: 'Organization' }]);
            mockUserRepository.findUserById.mockResolvedValue(user);

            await expect(municipalityUserService.getMunicipalityUserById(1)).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for an Administrator role', async () => {
            const user = createMockUserWithRoles([{ roleName: 'Administrator', departmentName: 'Organization' }]);
            mockUserRepository.findUserById.mockResolvedValue(user);

            await expect(municipalityUserService.getMunicipalityUserById(1)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteMunicipalityUser', () => {
        it('should delete a user successfully', async () => {
            const user = createMockUserWithRoles(
                [{ roleName: 'Municipal Officer', departmentName: 'Public Works' }],
                { id: 1, username: 'testuser' }
            );
            mockUserRepository.findUserById.mockResolvedValue(user);
            mockUserRepository.deleteUser.mockResolvedValue();

            await municipalityUserService.deleteMunicipalityUser(1);

            expect(mockUserRepository.deleteUser).toHaveBeenCalledWith(1);
            expect(mockLogInfo).toHaveBeenCalledWith(`Municipality user deleted: ${user.username} (ID: ${user.id})`);
        });

        it('should throw NotFoundError if user not found', async () => {
            mockUserRepository.findUserById.mockResolvedValue(null);

            await expect(municipalityUserService.deleteMunicipalityUser(1)).rejects.toThrow(NotFoundError);
        });

        it('should throw BadRequestError when trying to delete a Citizen', async () => {
            const user = createMockUserWithRoles([{ roleName: 'Citizen', departmentName: 'Organization' }]);
            mockUserRepository.findUserById.mockResolvedValue(user);

            await expect(municipalityUserService.deleteMunicipalityUser(1)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when trying to delete an Administrator', async () => {
            const user = createMockUserWithRoles([{ roleName: 'Administrator', departmentName: 'Organization' }]);
            mockUserRepository.findUserById.mockResolvedValue(user);

            await expect(municipalityUserService.deleteMunicipalityUser(1)).rejects.toThrow(BadRequestError);
        });
    });

    describe('updateMunicipalityUser', () => {
        const updateData = { first_name: 'Jane' };

        it('should update a user successfully', async () => {
            const existingUser = createMockUserWithRoles(
                [{ roleName: 'Municipal Officer', departmentName: 'Public Works' }],
                { id: 1, username: 'johndoe', email: 'john.doe@example.com' }
            );
            mockUserRepository.findUserById.mockResolvedValue(existingUser);
            mockUserRepository.updateUser.mockResolvedValue({ ...existingUser, firstName: 'Jane' });
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1, first_name: 'Jane', roles: [] } as any);

            const result = await municipalityUserService.updateMunicipalityUser(1, updateData);

            expect(result).toBeDefined();
            expect(result.first_name).toBe('Jane');
            expect(mockLogInfo).toHaveBeenCalled();
        });

        it('should throw BadRequestError if no update data is provided', async () => {
            await expect(municipalityUserService.updateMunicipalityUser(1, {})).rejects.toThrow(BadRequestError);
        });

        it('should throw NotFoundError if user not found', async () => {
            mockUserRepository.findUserById.mockResolvedValue(null);
            await expect(municipalityUserService.updateMunicipalityUser(1, updateData)).rejects.toThrow(NotFoundError);
        });

        it('should throw BadRequestError when trying to update a Citizen', async () => {
            const citizenUser = createMockUserWithRoles([{ roleName: 'Citizen', departmentName: 'Organization' }]);
            mockUserRepository.findUserById.mockResolvedValue(citizenUser);
            await expect(municipalityUserService.updateMunicipalityUser(1, updateData)).rejects.toThrow(BadRequestError);
        });

        it('should throw ConflictError if email already exists', async () => {
            const existingUser = createMockUserWithRoles(
                [{ roleName: 'Municipal Officer', departmentName: 'Public Works' }],
                { id: 1, email: 'john.doe@example.com' }
            );
            mockUserRepository.findUserById.mockResolvedValue(existingUser);
            mockUserRepository.existsUserByEmail.mockResolvedValue(true);
            await expect(municipalityUserService.updateMunicipalityUser(1, { email: 'new.email@example.com' })).rejects.toThrow(ConflictError);
        });

        it('should update roles when department_role_ids is provided', async () => {
            const existingUser = createMockUserWithRoles(
                [{ roleName: 'Municipal Officer', departmentName: 'Public Works' }],
                { id: 1 }
            );
            mockUserRepository.findUserById.mockResolvedValue(existingUser);
            // findById is called per-ID
            mockDepartmentRoleRepository.findById.mockResolvedValue(
                { id: 2, departmentId: 2, roleId: 2, department: { id: 2, name: 'Water Services', departmentRoles: [] }, role: { id: 2, name: 'Staff Member', description: '', departmentRoles: [] }, userRoles: [] } as any
            );
            mockUserRepository.updateUser.mockResolvedValue(existingUser);
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1, roles: [] } as any);

            await municipalityUserService.updateMunicipalityUser(1, { department_role_ids: [2] });

            // findById is called with individual ID, not array
            expect(mockDepartmentRoleRepository.findById).toHaveBeenCalledWith(2);
        });

        it('should throw BadRequestError when updating to External Maintainer without company', async () => {
            const existingUser = createMockUserWithRoles(
                [{ roleName: 'Municipal Officer', departmentName: 'Public Works' }],
                { id: 1 }
            );
            mockUserRepository.findUserById.mockResolvedValue(existingUser);
            // New role is External Maintainer
            mockDepartmentRoleRepository.findById.mockResolvedValue(
                { id: 2, departmentId: 2, roleId: 2, department: { id: 2, name: 'External', departmentRoles: [] }, role: { id: 2, name: 'External Maintainer', description: '', departmentRoles: [] }, userRoles: [] } as any
            );

            await expect(municipalityUserService.updateMunicipalityUser(1, { department_role_ids: [2], company_name: undefined })).rejects.toThrow('External Maintainer role requires a company assignment');
        });

        it('should throw BadRequestError when External Maintainer tries to remove company', async () => {
            const existingUser = createMockUserWithRoles(
                [{ roleName: 'External Maintainer', departmentName: 'External' }],
                { id: 1, companyId: 10 }
            );
            mockUserRepository.findUserById.mockResolvedValue(existingUser);

            await expect(municipalityUserService.updateMunicipalityUser(1, { company_name: null as any })).rejects.toThrow('External Maintainer role requires a company');
        });
    });

    describe('removeRole', () => {
        it('should remove a role from user with multiple roles', async () => {
            const user = createMockUserWithRoles([
                { roleName: 'Municipal Officer', departmentName: 'Public Works' },
                { roleName: 'Staff Member', departmentName: 'Water Services' }
            ], { id: 1 });
            mockUserRepository.findUserById.mockResolvedValue(user);
            mockUserRepository.updateUser.mockResolvedValue(user);
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1, roles: [] } as any);

            const result = await municipalityUserService.removeRole(1, 1);

            expect(result).toBeDefined();
        });

        it('should throw BadRequestError when trying to remove last role', async () => {
            const user = createMockUserWithRoles([
                { roleName: 'Municipal Officer', departmentName: 'Public Works' }
            ], { id: 1 });
            mockUserRepository.findUserById.mockResolvedValue(user);

            await expect(municipalityUserService.removeRole(1, 1)).rejects.toThrow(BadRequestError);
        });

        it('should throw NotFoundError if user not found', async () => {
            mockUserRepository.findUserById.mockResolvedValue(null);

            await expect(municipalityUserService.removeRole(1, 1)).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError if role not assigned to user', async () => {
            const user = createMockUserWithRoles([
                { roleName: 'Municipal Officer', departmentName: 'Public Works' },
                { roleName: 'Staff Member', departmentName: 'Water Services' }
            ], { id: 1 });
            mockUserRepository.findUserById.mockResolvedValue(user);

            await expect(municipalityUserService.removeRole(1, 999)).rejects.toThrow(NotFoundError);
        });
    });
});
