"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const municipalityUserService_1 = require("@services/municipalityUserService");
const userRepository_1 = require("@repositories/userRepository");
const departmentRoleRepository_1 = require("@repositories/departmentRoleRepository");
const loggingService_1 = require("@services/loggingService");
const mapperService_1 = require("@services/mapperService");
const mockEntities_1 = require("@test/utils/mockEntities");
const NotFoundError_1 = require("@models/errors/NotFoundError");
const BadRequestError_1 = require("@models/errors/BadRequestError");
const ConflictError_1 = require("@models/errors/ConflictError");
const AppError_1 = require("@models/errors/AppError");
jest.mock('@repositories/userRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@services/loggingService');
jest.mock('@services/mapperService');
const mockedUserRepository = userRepository_1.userRepository;
const mockedDepartmentRoleRepository = departmentRoleRepository_1.departmentRoleRepository;
const mockedLogInfo = loggingService_1.logInfo;
const mockedMapper = mapperService_1.mapUserEntityToUserResponse;
const mockStaffEntity = (0, mockEntities_1.createMockMunicipalityUser)('Municipal Administrator', 'Public Relations', {
    id: 1,
    username: 'staff.user',
    email: 'staff@test.com',
    firstName: 'Staff',
    lastName: 'User',
});
const mockStaffResponse = {
    id: 1,
    username: 'staff.user',
    email: 'staff@test.com',
    first_name: 'Staff',
    last_name: 'User',
    role_name: 'Municipal Administrator',
    department_name: 'Public Relations',
};
const mockCitizenEntity = (0, mockEntities_1.createMockCitizen)({
    id: 2,
    username: 'citizen.user',
    email: 'citizen@test.com',
    firstName: 'Citizen',
    lastName: 'User',
});
const mockAdminEntity = (0, mockEntities_1.createMockMunicipalityUser)('Administrator', 'Administration', {
    id: 3,
    username: 'admin.user',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
});
describe('MunicipalityUserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock departmentRoleRepository.findAll() to return a default set of department roles
        const mockDepartmentRole = (0, mockEntities_1.createMockDepartmentRole)('Technical Office Staff Member', 'Public Relations');
        mockedDepartmentRoleRepository.findAll.mockResolvedValue([mockDepartmentRole]);
        // Mock userRepository.findUsersExcludingRoles() to return empty array by default
        mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([]);
        mockedMapper.mockImplementation((entity) => {
            if (!entity)
                return null;
            return {
                id: entity.id,
                username: entity.username,
                email: entity.email,
                first_name: entity.firstName,
                last_name: entity.lastName,
                role_name: entity.departmentRole?.role?.name,
                department_name: entity.departmentRole?.department?.name,
            };
        });
    });
    describe('createMunicipalityUser', () => {
        const registerRequest = {
            username: 'new.staff',
            email: 'new@staff.com',
            first_name: 'New',
            last_name: 'Staff',
            password: 'Password123!',
            role_name: 'Technical Office Staff Member',
        };
        it('should create a new municipality user successfully', async () => {
            mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
            const newEntity = (0, mockEntities_1.createMockMunicipalityUser)('Technical Office Staff Member', 'Public Relations', {
                id: 10,
                username: registerRequest.username,
                email: registerRequest.email,
                firstName: registerRequest.first_name,
                lastName: registerRequest.last_name,
            });
            mockedUserRepository.createUserWithPassword.mockResolvedValue(newEntity);
            const result = await municipalityUserService_1.municipalityUserService.createMunicipalityUser(registerRequest);
            expect(result.username).toBe(registerRequest.username);
            expect(result.role_name).toBe('Technical Office Staff Member');
            expect(mockedUserRepository.existsUserByUsername).toHaveBeenCalledWith(registerRequest.username);
            expect(mockedUserRepository.existsUserByEmail).toHaveBeenCalledWith(registerRequest.email);
            expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledTimes(1);
            expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Municipality user created'));
        });
        it('should throw BadRequestError when trying to create a CITIZEN', async () => {
            const citizenRequest = { ...registerRequest, role_name: 'Citizen' };
            await expect(municipalityUserService_1.municipalityUserService.createMunicipalityUser(citizenRequest)).rejects.toThrow(BadRequestError_1.BadRequestError);
            expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
        });
        it('should throw BadRequestError when trying to create an ADMINISTRATOR', async () => {
            const adminRequest = { ...registerRequest, role_name: 'Administrator' };
            await expect(municipalityUserService_1.municipalityUserService.createMunicipalityUser(adminRequest)).rejects.toThrow(BadRequestError_1.BadRequestError);
        });
        it('should throw ConflictError if username already exists', async () => {
            mockedUserRepository.existsUserByUsername.mockResolvedValue(true);
            await expect(municipalityUserService_1.municipalityUserService.createMunicipalityUser(registerRequest)).rejects.toThrow(ConflictError_1.ConflictError);
            expect(mockedUserRepository.existsUserByEmail).not.toHaveBeenCalled();
        });
        it('should throw ConflictError if email already exists', async () => {
            mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(true);
            await expect(municipalityUserService_1.municipalityUserService.createMunicipalityUser(registerRequest)).rejects.toThrow(ConflictError_1.ConflictError);
        });
        it('should throw AppError if mapping fails (safeMapUserToResponse)', async () => {
            mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockedUserRepository.createUserWithPassword.mockResolvedValue(mockStaffEntity);
            mockedMapper.mockReturnValue(null);
            await expect(municipalityUserService_1.municipalityUserService.createMunicipalityUser(registerRequest)).rejects.toThrow(AppError_1.AppError);
        });
    });
    describe('getAllMunicipalityUsers', () => {
        it('should return an array of all municipality users', async () => {
            mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([mockStaffEntity, mockStaffEntity]);
            const result = await municipalityUserService_1.municipalityUserService.getAllMunicipalityUsers();
            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBe(2);
            expect(result[0]).toEqual(mockStaffResponse);
            expect(mockedUserRepository.findUsersExcludingRoles).toHaveBeenCalledWith(['Citizen', 'Administrator']);
        });
        it('should return an empty array if no users found', async () => {
            mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([]);
            const result = await municipalityUserService_1.municipalityUserService.getAllMunicipalityUsers();
            expect(result.length).toBe(0);
        });
        it('should filter out null values if mapper returns null for an item', async () => {
            mockedMapper
                .mockReturnValueOnce(mockStaffResponse)
                .mockReturnValueOnce(null);
            mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([mockStaffEntity, mockStaffEntity]);
            const result = await municipalityUserService_1.municipalityUserService.getAllMunicipalityUsers();
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(mockStaffResponse.id);
        });
    });
    describe('getMunicipalityUserById', () => {
        it('should return a user by ID successfully', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            const result = await municipalityUserService_1.municipalityUserService.getMunicipalityUserById(1);
            expect(result).toEqual(mockStaffResponse);
            expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(1);
        });
        it('should throw NotFoundError if user not found', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(null);
            await expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById(999)).rejects.toThrow(NotFoundError_1.NotFoundError);
            await expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById(999)).rejects.toThrow('User not found');
        });
        it('should throw NotFoundError if user is a CITIZEN', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
            await expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById(2)).rejects.toThrow(NotFoundError_1.NotFoundError);
            await expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById(2)).rejects.toThrow('Municipality user not found');
        });
        it('should throw NotFoundError if user is an ADMINISTRATOR', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
            await expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById(3)).rejects.toThrow(NotFoundError_1.NotFoundError);
            await expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById(3)).rejects.toThrow('Municipality user not found');
        });
        it('should throw AppError if mapping fails (safeMapUserToResponse)', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedMapper.mockReturnValue(null);
            await expect(municipalityUserService_1.municipalityUserService.getMunicipalityUserById(1)).rejects.toThrow(AppError_1.AppError);
        });
    });
    describe('updateMunicipalityUser', () => {
        const updateData = { firstName: 'Updated' };
        const updatedEntity = { ...mockStaffEntity, firstName: 'Updated' };
        it('should update a user successfully', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
            const result = await municipalityUserService_1.municipalityUserService.updateMunicipalityUser(1, updateData);
            expect(result.first_name).toBe('Updated');
            expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(1, updateData);
            expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Municipality user updated'));
        });
        it('should throw NotFoundError if user to update is not found', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(null);
            await expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser(999, updateData)).rejects.toThrow(NotFoundError_1.NotFoundError);
        });
        it('should throw BadRequestError when trying to update a CITIZEN', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
            await expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser(2, updateData)).rejects.toThrow(BadRequestError_1.BadRequestError);
        });
        it('should throw BadRequestError when trying to update an ADMINISTRATOR', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
            await expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser(3, updateData)).rejects.toThrow(BadRequestError_1.BadRequestError);
        });
        it('should throw BadRequestError if trying to change role to CITIZEN', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            const updateRoleData = { role_name: 'Citizen' };
            await expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser(1, updateRoleData)).rejects.toThrow(BadRequestError_1.BadRequestError);
        });
        it('should throw BadRequestError if trying to change role to ADMINISTRATOR', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            const updateRoleData = { role_name: 'Administrator' };
            await expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser(1, updateRoleData)).rejects.toThrow(BadRequestError_1.BadRequestError);
        });
        it('should check for email conflict and update successfully if email is new and available', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
            mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
            const emailUpdate = { email: 'new.email@test.com' };
            await municipalityUserService_1.municipalityUserService.updateMunicipalityUser(1, emailUpdate);
            expect(mockedUserRepository.existsUserByEmail).toHaveBeenCalledWith(emailUpdate.email);
            expect(mockedUserRepository.updateUser).toHaveBeenCalledTimes(1);
        });
        it('should throw ConflictError if new email already exists', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.existsUserByEmail.mockResolvedValue(true);
            const emailUpdate = { email: 'new.email@test.com' };
            await expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser(1, emailUpdate)).rejects.toThrow(ConflictError_1.ConflictError);
        });
        it('should NOT check for email conflict if email is not changing', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.updateUser.mockResolvedValue(mockStaffEntity);
            const emailUpdate = { email: mockStaffEntity.email };
            await municipalityUserService_1.municipalityUserService.updateMunicipalityUser(1, emailUpdate);
            expect(mockedUserRepository.existsUserByEmail).not.toHaveBeenCalled();
        });
        it('should throw AppError if mapping fails after update (safeMapUserToResponse)', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
            mockedMapper.mockReturnValue(null);
            await expect(municipalityUserService_1.municipalityUserService.updateMunicipalityUser(1, updateData)).rejects.toThrow(AppError_1.AppError);
        });
    });
    describe('deleteMunicipalityUser', () => {
        it('should delete a user successfully', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.deleteUser.mockResolvedValue(undefined);
            await municipalityUserService_1.municipalityUserService.deleteMunicipalityUser(1);
            expect(mockedUserRepository.deleteUser).toHaveBeenCalledWith(1);
            expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Municipality user deleted'));
        });
        it('should throw NotFoundError if user to delete is not found', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(null);
            await expect(municipalityUserService_1.municipalityUserService.deleteMunicipalityUser(999)).rejects.toThrow(NotFoundError_1.NotFoundError);
            expect(mockedUserRepository.deleteUser).not.toHaveBeenCalled();
        });
        it('should throw BadRequestError when trying to delete a CITIZEN', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
            await expect(municipalityUserService_1.municipalityUserService.deleteMunicipalityUser(2)).rejects.toThrow(BadRequestError_1.BadRequestError);
            expect(mockedUserRepository.deleteUser).not.toHaveBeenCalled();
        });
        it('should throw BadRequestError when trying to delete an ADMINISTRATOR', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
            await expect(municipalityUserService_1.municipalityUserService.deleteMunicipalityUser(3)).rejects.toThrow(BadRequestError_1.BadRequestError);
            expect(mockedUserRepository.deleteUser).not.toHaveBeenCalled();
        });
    });
    describe('assignRole', () => {
        const newRole = 'Urban Planning Manager';
        const mockNewDepartmentRole = (0, mockEntities_1.createMockDepartmentRole)(newRole, 'Public Relations');
        const updatedEntity = (0, mockEntities_1.createMockMunicipalityUser)(newRole, 'Public Relations', {
            id: 1,
            username: 'staff.user',
            email: 'staff@test.com',
            firstName: 'Staff',
            lastName: 'User',
        });
        it('should assign a valid role to a municipality user successfully', async () => {
            mockedDepartmentRoleRepository.findAll.mockResolvedValue([mockNewDepartmentRole]);
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
            const result = await municipalityUserService_1.municipalityUserService.assignRole(1, newRole);
            expect(result.role_name).toBe(newRole);
            expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(1, { departmentRoleId: mockNewDepartmentRole.id });
            expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Role assigned to user'));
        });
        it('should throw BadRequestError when trying to assign CITIZEN role', async () => {
            await expect(municipalityUserService_1.municipalityUserService.assignRole(1, 'Citizen')).rejects.toThrow(BadRequestError_1.BadRequestError);
            expect(mockedUserRepository.findUserById).not.toHaveBeenCalled();
        });
        it('should throw BadRequestError when trying to assign ADMINISTRATOR role', async () => {
            await expect(municipalityUserService_1.municipalityUserService.assignRole(1, 'Administrator')).rejects.toThrow(BadRequestError_1.BadRequestError);
            expect(mockedUserRepository.findUserById).not.toHaveBeenCalled();
        });
        it('should throw NotFoundError if user not found', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(null);
            await expect(municipalityUserService_1.municipalityUserService.assignRole(999, newRole)).rejects.toThrow(NotFoundError_1.NotFoundError);
        });
        it('should throw BadRequestError when trying to assign role TO a CITIZEN', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
            await expect(municipalityUserService_1.municipalityUserService.assignRole(2, newRole)).rejects.toThrow(BadRequestError_1.BadRequestError);
        });
        it('should throw BadRequestError when trying to assign role TO an ADMINISTRATOR', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
            await expect(municipalityUserService_1.municipalityUserService.assignRole(3, newRole)).rejects.toThrow(BadRequestError_1.BadRequestError);
        });
        it('should throw AppError if mapping fails after role assignment (safeMapUserToResponse)', async () => {
            mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
            mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
            mockedMapper.mockReturnValue(null);
            await expect(municipalityUserService_1.municipalityUserService.assignRole(1, newRole)).rejects.toThrow(AppError_1.AppError);
        });
    });
});
