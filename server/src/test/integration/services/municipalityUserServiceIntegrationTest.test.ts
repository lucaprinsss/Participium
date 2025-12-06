import { municipalityUserService } from '@services/municipalityUserService';
import { userRepository } from '@repositories/userRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';
import { companyRepository } from '@repositories/companyRepository';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { RegisterRequest } from '@models/dto/input/RegisterRequest';
import { userEntity } from '@models/entity/userEntity';
import { UserResponse } from '@models/dto/output/UserResponse';
import { createMockMunicipalityUser, createMockCitizen, createMockDepartmentRole } from '@test/utils/mockEntities';

import { NotFoundError } from '@models/errors/NotFoundError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';

import { Not, In } from 'typeorm';

jest.mock('@repositories/userRepository');
jest.mock('@repositories/departmentRoleRepository');
jest.mock('@repositories/companyRepository');
jest.mock('@services/loggingService');
jest.mock('@services/mapperService');

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedDepartmentRoleRepository = departmentRoleRepository as jest.Mocked<typeof departmentRoleRepository>;
const mockedCompanyRepository = companyRepository as jest.Mocked<typeof companyRepository>;
const mockedLogInfo = logInfo as jest.Mock;
const mockedMapper = mapUserEntityToUserResponse as jest.Mock;

const mockStaffEntity: userEntity = createMockMunicipalityUser('Municipal Administrator', 'Public Relations', {
  id: 1,
  username: 'staff.user',
  email: 'staff@test.com',
  firstName: 'Staff',
  lastName: 'User',
});

const mockStaffResponse: UserResponse = {
  id: 1,
  username: 'staff.user',
  email: 'staff@test.com',
  first_name: 'Staff',
  last_name: 'User',
  role_name: 'Municipal Administrator',
  department_name: 'Public Relations',
};

const mockCitizenEntity: userEntity = createMockCitizen({
  id: 2,
  username: 'citizen.user',
  email: 'citizen@test.com',
  firstName: 'Citizen',
  lastName: 'User',
});

const mockAdminEntity: userEntity = createMockMunicipalityUser('Administrator', 'Administration', {
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
    const mockDepartmentRole = createMockDepartmentRole('Technical Office Staff Member', 'Public Relations');
    mockedDepartmentRoleRepository.findAll.mockResolvedValue([mockDepartmentRole]);

    // Mock userRepository.findUsersExcludingRoles() to return empty array by default
    mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([]);

    // Mock companyRepository.findById() to return null by default (most users don't have a company)
    mockedCompanyRepository.findById.mockResolvedValue(null);

    mockedMapper.mockImplementation((entity: userEntity, companyName?: string) => {
      if (!entity) return null;
      return {
        id: entity.id,
        username: entity.username,
        email: entity.email,
        first_name: entity.firstName,
        last_name: entity.lastName,
        role_name: entity.departmentRole?.role?.name,
        department_name: entity.departmentRole?.department?.name,
        company_name: companyName,
      };
    });
  });

  describe('createMunicipalityUser', () => {
    const registerRequest: RegisterRequest = {
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
      
      const newEntity = createMockMunicipalityUser('Technical Office Staff Member', 'Public Relations', {
        id: 10,
        username: registerRequest.username,
        email: registerRequest.email,
        firstName: registerRequest.first_name,
        lastName: registerRequest.last_name,
      });
      mockedUserRepository.createUserWithPassword.mockResolvedValue(newEntity);

      const result = await municipalityUserService.createMunicipalityUser(registerRequest);

      expect(result.username).toBe(registerRequest.username);
      expect(result.role_name).toBe('Technical Office Staff Member');
      expect(mockedUserRepository.existsUserByUsername).toHaveBeenCalledWith(registerRequest.username);
      expect(mockedUserRepository.existsUserByEmail).toHaveBeenCalledWith(registerRequest.email);
      expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledTimes(1);
      expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Municipality user created'));
    });

    it('should throw BadRequestError when trying to create a CITIZEN', async () => {
      const citizenRequest = { ...registerRequest, role_name: 'Citizen' };
      
      await expect(
        municipalityUserService.createMunicipalityUser(citizenRequest)
      ).rejects.toThrow(BadRequestError);
      
      expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to create an ADMINISTRATOR', async () => {
      const adminRequest = { ...registerRequest, role_name: 'Administrator' };
      
      await expect(
        municipalityUserService.createMunicipalityUser(adminRequest)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw ConflictError if username already exists', async () => {
      mockedUserRepository.existsUserByUsername.mockResolvedValue(true);

      await expect(
        municipalityUserService.createMunicipalityUser(registerRequest)
      ).rejects.toThrow(ConflictError);
      expect(mockedUserRepository.existsUserByEmail).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(true);

      await expect(
        municipalityUserService.createMunicipalityUser(registerRequest)
      ).rejects.toThrow(ConflictError);
    });

    it('should throw AppError if mapping fails (safeMapUserToResponse)', async () => {
      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      mockedUserRepository.createUserWithPassword.mockResolvedValue(mockStaffEntity);
      
      mockedMapper.mockReturnValue(null);

      await expect(
        municipalityUserService.createMunicipalityUser(registerRequest)
      ).rejects.toThrow(AppError);
    });

    it('should create External Maintainer with company successfully', async () => {
      const maintainerRequest: RegisterRequest = {
        username: 'maintainer.user',
        email: 'maintainer@company.com',
        first_name: 'John',
        last_name: 'Doe',
        password: 'Password123!',
        role_name: 'External Maintainer',
        company_name: 'Test Company Ltd',
      };

      // Mock External Maintainer role exists
      const mockExternalMaintainerRole = createMockDepartmentRole('External Maintainer', 'Maintenance Department');
      mockedDepartmentRoleRepository.findAll.mockResolvedValue([mockExternalMaintainerRole]);

      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      mockedCompanyRepository.findByName.mockResolvedValue({ id: 1, name: 'Test Company Ltd', category: 'maintenance', createdAt: new Date() });
      
      const maintainerEntity = createMockMunicipalityUser('External Maintainer', 'Maintenance Department', {
        id: 15,
        username: maintainerRequest.username,
        email: maintainerRequest.email,
        firstName: maintainerRequest.first_name,
        lastName: maintainerRequest.last_name,
        companyId: 1,
      });
      mockedUserRepository.createUserWithPassword.mockResolvedValue(maintainerEntity);

      const result = await municipalityUserService.createMunicipalityUser(maintainerRequest);

      expect(result.username).toBe(maintainerRequest.username);
      expect(result.role_name).toBe('External Maintainer');
      expect(mockedCompanyRepository.findByName).toHaveBeenCalledWith('Test Company Ltd');
      expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledWith(
        expect.objectContaining({ 
          username: maintainerRequest.username,
          companyId: 1,
          password: maintainerRequest.password
        })
      );
    });

    it('should throw BadRequestError when External Maintainer created without company', async () => {
      const maintainerRequest: RegisterRequest = {
        username: 'maintainer.user',
        email: 'maintainer@company.com',
        first_name: 'John',
        last_name: 'Doe',
        password: 'Password123!',
        role_name: 'External Maintainer',
      };

      await expect(
        municipalityUserService.createMunicipalityUser(maintainerRequest)
      ).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when non-External Maintainer role has company', async () => {
      const invalidRequest: RegisterRequest = {
        username: 'staff.user',
        email: 'staff@test.com',
        first_name: 'Staff',
        last_name: 'User',
        password: 'Password123!',
        role_name: 'Technical Office Staff Member',
        company_name: 'Some Company',
      };

      await expect(
        municipalityUserService.createMunicipalityUser(invalidRequest)
      ).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when company does not exist', async () => {
      const maintainerRequest: RegisterRequest = {
        username: 'maintainer.user',
        email: 'maintainer@company.com',
        first_name: 'John',
        last_name: 'Doe',
        password: 'Password123!',
        role_name: 'External Maintainer',
        company_name: 'Non Existent Company',
      };

      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      mockedCompanyRepository.findByName.mockResolvedValue(null);

      await expect(
        municipalityUserService.createMunicipalityUser(maintainerRequest)
      ).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('getAllMunicipalityUsers', () => {
    it('should return an array of all municipality users', async () => {
      mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([mockStaffEntity, mockStaffEntity]);

      const result = await municipalityUserService.getAllMunicipalityUsers();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual(mockStaffResponse); 
      expect(mockedUserRepository.findUsersExcludingRoles).toHaveBeenCalledWith(['Citizen', 'Administrator']);
    });

    it('should return an empty array if no users found', async () => {
      mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([]);
      const result = await municipalityUserService.getAllMunicipalityUsers();
      expect(result.length).toBe(0);
    });

    it('should filter out null values if mapper returns null for an item', async () => {
      mockedMapper
        .mockReturnValueOnce(mockStaffResponse) 
        .mockReturnValueOnce(null);              

      mockedUserRepository.findUsersExcludingRoles.mockResolvedValue([mockStaffEntity, mockStaffEntity]);
      
      const result = await municipalityUserService.getAllMunicipalityUsers();

      expect(result.length).toBe(1); 
      expect(result[0].id).toBe(mockStaffResponse.id);
    });
  });

  describe('getMunicipalityUserById', () => {
    it('should return a user by ID successfully', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      
      const result = await municipalityUserService.getMunicipalityUserById(1);
      
      expect(result).toEqual(mockStaffResponse);
      expect(mockedUserRepository.findUserById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundError if user not found', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(null);
      
      await expect(municipalityUserService.getMunicipalityUserById(999)).rejects.toThrow(NotFoundError);
      await expect(municipalityUserService.getMunicipalityUserById(999)).rejects.toThrow('User not found');
    });

    it('should throw NotFoundError if user is a CITIZEN', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
      
      await expect(municipalityUserService.getMunicipalityUserById(2)).rejects.toThrow(NotFoundError);
      await expect(municipalityUserService.getMunicipalityUserById(2)).rejects.toThrow('Municipality user not found');
    });

    it('should throw NotFoundError if user is an ADMINISTRATOR', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
      
      await expect(municipalityUserService.getMunicipalityUserById(3)).rejects.toThrow(NotFoundError);
      await expect(municipalityUserService.getMunicipalityUserById(3)).rejects.toThrow('Municipality user not found');
    });

    it('should throw AppError if mapping fails (safeMapUserToResponse)', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedMapper.mockReturnValue(null); 

      await expect(municipalityUserService.getMunicipalityUserById(1)).rejects.toThrow(AppError);
    });
  });

  describe('updateMunicipalityUser', () => {
    const updateData = { first_name: 'Updated' };
    const updatedEntity = { ...mockStaffEntity, firstName: 'Updated' };

    it('should update a user successfully', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);

      const result = await municipalityUserService.updateMunicipalityUser(1, updateData);

      expect(result.first_name).toBe('Updated');
      // Service transforms first_name to firstName for repository
      expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(1, 
        expect.objectContaining({ firstName: 'Updated' })
      );
      expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Municipality user updated'));
    });

    it('should throw NotFoundError if user to update is not found', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(null);
      
      await expect(municipalityUserService.updateMunicipalityUser(999, updateData)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when trying to update a CITIZEN', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
      
      await expect(municipalityUserService.updateMunicipalityUser(2, updateData)).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError when trying to update an ADMINISTRATOR', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
      
      await expect(municipalityUserService.updateMunicipalityUser(3, updateData)).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if trying to change role to CITIZEN', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      const updateRoleData = { role_name: 'Citizen' };

      await expect(municipalityUserService.updateMunicipalityUser(1, updateRoleData)).rejects.toThrow(BadRequestError);
    });
    
    it('should throw BadRequestError if trying to change role to ADMINISTRATOR', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      const updateRoleData = { role_name: 'Administrator' };

      await expect(municipalityUserService.updateMunicipalityUser(1, updateRoleData)).rejects.toThrow(BadRequestError);
    });

    it('should check for email conflict and update successfully if email is new and available', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
      
      const emailUpdate = { email: 'new.email@test.com' };
      await municipalityUserService.updateMunicipalityUser(1, emailUpdate);

      expect(mockedUserRepository.existsUserByEmail).toHaveBeenCalledWith(emailUpdate.email);
      expect(mockedUserRepository.updateUser).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError if new email already exists', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(true);
      
      const emailUpdate = { email: 'new.email@test.com' };
      
      await expect(municipalityUserService.updateMunicipalityUser(1, emailUpdate)).rejects.toThrow(ConflictError);
    });

    it('should NOT check for email conflict if email is not changing', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.updateUser.mockResolvedValue(mockStaffEntity);
      
      const emailUpdate = { email: mockStaffEntity.email }; 
      await municipalityUserService.updateMunicipalityUser(1, emailUpdate);

      expect(mockedUserRepository.existsUserByEmail).not.toHaveBeenCalled();
    });

    it('should throw AppError if mapping fails after update (safeMapUserToResponse)', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
      mockedMapper.mockReturnValue(null); 

      await expect(municipalityUserService.updateMunicipalityUser(1, updateData)).rejects.toThrow(AppError);
    });

    it('should update External Maintainer company successfully', async () => {
      const maintainerEntity = createMockMunicipalityUser('External Maintainer', 'Maintenance Department', {
        id: 10,
        username: 'maintainer.user',
        email: 'maintainer@test.com',
        firstName: 'John',
        lastName: 'Doe',
        companyId: 1,
      });

      mockedUserRepository.findUserById.mockResolvedValue(maintainerEntity);
      mockedCompanyRepository.findByName.mockResolvedValue({ id: 2, name: 'New Company Ltd', category: 'maintenance', createdAt: new Date() });
      
      const updatedMaintainerEntity = { ...maintainerEntity, companyId: 2 };
      mockedUserRepository.updateUser.mockResolvedValue(updatedMaintainerEntity);

      const updateCompanyData = { company_name: 'New Company Ltd' };
      const result = await municipalityUserService.updateMunicipalityUser(10, updateCompanyData);

      expect(mockedCompanyRepository.findByName).toHaveBeenCalledWith('New Company Ltd');
      expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(10, expect.objectContaining({ companyId: 2 }));
    });

    it('should throw BadRequestError when adding company to non-External Maintainer', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);

      const updateCompanyData = { company_name: 'Some Company' };
      
      await expect(
        municipalityUserService.updateMunicipalityUser(1, updateCompanyData)
      ).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.updateUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when removing company from External Maintainer', async () => {
      const maintainerEntity = createMockMunicipalityUser('External Maintainer', 'Maintenance Department', {
        id: 10,
        username: 'maintainer.user',
        email: 'maintainer@test.com',
        firstName: 'John',
        lastName: 'Doe',
        companyId: 1,
      });

      mockedUserRepository.findUserById.mockResolvedValue(maintainerEntity);

      const updateData = { company_name: undefined };
      
      await expect(
        municipalityUserService.updateMunicipalityUser(10, updateData)
      ).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('deleteMunicipalityUser', () => {
    it('should delete a user successfully', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.deleteUser.mockResolvedValue(undefined); 

      await municipalityUserService.deleteMunicipalityUser(1);

      expect(mockedUserRepository.deleteUser).toHaveBeenCalledWith(1);
      expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Municipality user deleted'));
    });

    it('should throw NotFoundError if user to delete is not found', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(null);
      
      await expect(municipalityUserService.deleteMunicipalityUser(999)).rejects.toThrow(NotFoundError);
      expect(mockedUserRepository.deleteUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to delete a CITIZEN', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
      
      await expect(municipalityUserService.deleteMunicipalityUser(2)).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.deleteUser).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to delete an ADMINISTRATOR', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
      
      await expect(municipalityUserService.deleteMunicipalityUser(3)).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.deleteUser).not.toHaveBeenCalled();
    });
  });

  describe('assignRole', () => {
    const newRole = 'Urban Planning Manager'; 
    const mockNewDepartmentRole = createMockDepartmentRole(newRole, 'Public Relations');
    const updatedEntity = createMockMunicipalityUser(newRole, 'Public Relations', {
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

      const result = await municipalityUserService.assignRole(1, newRole);

      expect(result.role_name).toBe(newRole);
      expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(1, { departmentRoleId: mockNewDepartmentRole.id });
      expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Role assigned to user'));
    });

    it('should throw BadRequestError when trying to assign CITIZEN role', async () => {
      await expect(municipalityUserService.assignRole(1, 'Citizen')).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.findUserById).not.toHaveBeenCalled();
    });
    
    it('should throw BadRequestError when trying to assign ADMINISTRATOR role', async () => {
      await expect(municipalityUserService.assignRole(1, 'Administrator')).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.findUserById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundError if user not found', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(null);
      
      await expect(municipalityUserService.assignRole(999, newRole)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when trying to assign role TO a CITIZEN', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockCitizenEntity);
      
      await expect(municipalityUserService.assignRole(2, newRole)).rejects.toThrow(BadRequestError);
    });
    
    it('should throw BadRequestError when trying to assign role TO an ADMINISTRATOR', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockAdminEntity);
      
      await expect(municipalityUserService.assignRole(3, newRole)).rejects.toThrow(BadRequestError);
    });

    it('should throw AppError if mapping fails after role assignment (safeMapUserToResponse)', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);
      mockedMapper.mockReturnValue(null); 

      await expect(municipalityUserService.assignRole(1, newRole)).rejects.toThrow(AppError);
    });
  });
});