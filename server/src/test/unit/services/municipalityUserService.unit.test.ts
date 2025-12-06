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

jest.mock('@repositories/userRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@repositories/companyRepository');
jest.mock('@services/loggingService');
jest.mock('@services/mapperService');

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
        const registerData: RegisterRequest = {
            role_name: 'Municipal Officer',
            password: 'password123',
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
            email: 'john.doe@example.com',
            department_name: 'Public Works',
        };

        it('should create a municipality user successfully', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue({ id: 1, department: {id: 1, name: 'Public Works', departmentRoles: []}, role: {id: 1, name: 'Municipal Officer', departmentRoles: []} } as any);
            mockUserRepository.createUserWithPassword.mockResolvedValue({ id: 1, ...registerData } as any);
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1, username: 'johndoe' } as any);

            const result = await municipalityUserService.createMunicipalityUser(registerData);

            expect(result).toBeDefined();
            expect(result.id).toBe(1);
            expect(mockLogInfo).toHaveBeenCalled();
        });

        it('should throw BadRequestError when trying to create a Citizen', async () => {
            const data = { ...registerData, role_name: 'Citizen' };
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when trying to create an Administrator', async () => {
            const data = { ...registerData, role_name: 'Administrator' };
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

        it('should throw BadRequestError if company is assigned to a non-External Maintainer role', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            const data = { ...registerData, company_name: 'Test Company' };
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError if company is not assigned to an External Maintainer role', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            const data = { ...registerData, role_name: 'External Maintainer' };
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow(BadRequestError);
        });

        it('should throw NotFoundError if company is not found', async () => {
            const data = { ...registerData, role_name: 'External Maintainer', company_name: 'Ghost Company' };
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockCompanyRepository.findByName.mockResolvedValue(null);
            await expect(municipalityUserService.createMunicipalityUser(data)).rejects.toThrow(NotFoundError);
        });

        it('should throw BadRequestError if department role is not found', async () => {
            mockUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue(null);
            await expect(municipalityUserService.createMunicipalityUser(registerData)).rejects.toThrow(BadRequestError);
        });
    });

    describe('getAllMunicipalityUsers', () => {
        it('should return a list of municipality users', async () => {
            mockUserRepository.findUsersExcludingRoles.mockResolvedValue([
                { id: 1, username: 'user1' } as any,
                { id: 2, username: 'user2' } as any,
            ]);
            mockMapUserEntityToUserResponse.mockImplementation(user => ({ id: user.id, username: user.username }));

            const result = await municipalityUserService.getAllMunicipalityUsers();
            
            expect(result).toHaveLength(2);
            expect(mockUserRepository.findUsersExcludingRoles).toHaveBeenCalledWith(['Citizen', 'Administrator']);
            expect(mockLogInfo).toHaveBeenCalled();
        });
    });

    describe('getMunicipalityUserById', () => {
        it('should return a user when found', async () => {
            const user = { id: 1, departmentRole: { role: { name: 'Municipal Officer', departmentRoles: [] } } };
            mockUserRepository.findUserById.mockResolvedValue(user as any);
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1 } as any);

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
            const user = { id: 1, departmentRole: { role: { name: 'Citizen', departmentRoles: [] } } };
            mockUserRepository.findUserById.mockResolvedValue(user as any);

            await expect(municipalityUserService.getMunicipalityUserById(1)).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for an Administrator role', async () => {
            const user = { id: 1, departmentRole: { role: { name: 'Administrator', departmentRoles: [] } } };
            mockUserRepository.findUserById.mockResolvedValue(user as any);

            await expect(municipalityUserService.getMunicipalityUserById(1)).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteMunicipalityUser', () => {
        it('should delete a user successfully', async () => {
            const user = { id: 1, username: 'testuser', departmentRole: { role: { name: 'Municipal Officer', departmentRoles: [] } } };
            mockUserRepository.findUserById.mockResolvedValue(user as any);
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
            const user = { id: 1, departmentRole: { role: { name: 'Citizen', departmentRoles: [] } } };
            mockUserRepository.findUserById.mockResolvedValue(user as any);

            await expect(municipalityUserService.deleteMunicipalityUser(1)).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when trying to delete an Administrator', async () => {
            const user = { id: 1, departmentRole: { role: { name: 'Administrator', departmentRoles: [] } } };
            mockUserRepository.findUserById.mockResolvedValue(user as any);

            await expect(municipalityUserService.deleteMunicipalityUser(1)).rejects.toThrow(BadRequestError);
        });
    });

    describe('assignRole', () => {
        it('should assign a role to a user successfully', async () => {
            const user = { id: 1, username: 'testuser', departmentRole: { role: { name: 'Municipal Officer', departmentRoles: [] } } };
            const updatedUser = { ...user, departmentRoleId: 2 };
            mockUserRepository.findUserById.mockResolvedValue(user as any);
            mockDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue({ id: 2 } as any);
            mockUserRepository.updateUser.mockResolvedValue(updatedUser as any);
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1 } as any);

            await municipalityUserService.assignRole(1, 'New Role', 'New Department');

            expect(mockUserRepository.updateUser).toHaveBeenCalledWith(1, { departmentRoleId: 2 });
            expect(mockLogInfo).toHaveBeenCalled();
        });

        it('should throw BadRequestError when assigning Citizen role', async () => {
            await expect(municipalityUserService.assignRole(1, 'Citizen')).rejects.toThrow(BadRequestError);
        });

        it('should throw BadRequestError when assigning Administrator role', async () => {
            await expect(municipalityUserService.assignRole(1, 'Administrator')).rejects.toThrow(BadRequestError);
        });

        it('should throw NotFoundError if user not found', async () => {
            mockUserRepository.findUserById.mockResolvedValue(null);
            await expect(municipalityUserService.assignRole(1, 'New Role')).rejects.toThrow(NotFoundError);
        });

        it('should throw BadRequestError if department role not found', async () => {
            const user = { id: 1, username: 'testuser', departmentRole: { role: { name: 'Municipal Officer', departmentRoles: [] } } };
            mockUserRepository.findUserById.mockResolvedValue(user as any);
            mockDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue(null);

            await expect(municipalityUserService.assignRole(1, 'New Role', 'New Department')).rejects.toThrow(BadRequestError);
        });
    });

    describe('updateMunicipalityUser', () => {
        const updateData = { first_name: 'Jane' };
        const existingUser = { id: 1, username: 'johndoe', email: 'john.doe@example.com', departmentRole: { role: { name: 'Municipal Officer', departmentRoles: [] } } };

        it('should update a user successfully', async () => {
            mockUserRepository.findUserById.mockResolvedValue(existingUser as any);
            mockUserRepository.updateUser.mockResolvedValue({ ...existingUser, firstName: 'Jane' } as any);
            mockMapUserEntityToUserResponse.mockReturnValue({ id: 1, first_name: 'Jane' } as any);

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
            const citizenUser = { ...existingUser, departmentRole: { role: { name: 'Citizen' } } };
            mockUserRepository.findUserById.mockResolvedValue(citizenUser as any);
            await expect(municipalityUserService.updateMunicipalityUser(1, updateData)).rejects.toThrow(BadRequestError);
        });

        it('should throw ConflictError if email already exists', async () => {
            mockUserRepository.findUserById.mockResolvedValue(existingUser as any);
            mockUserRepository.existsUserByEmail.mockResolvedValue(true);
            await expect(municipalityUserService.updateMunicipalityUser(1, { email: 'new.email@example.com' })).rejects.toThrow(ConflictError);
        });
    });
});
