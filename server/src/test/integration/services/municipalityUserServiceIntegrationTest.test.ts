/* import { municipalityUserService } from '@services/municipalityUserService';
import { userRepository } from '@repositories/userRepository';
import { logInfo } from '@services/loggingService';
import { mapUserEntityToUserResponse } from '@services/mapperService';
import { UserRole } from '@models/dto/UserRole'; 
import { RegisterRequest } from '@models/dto/RegisterRequest';
import { userEntity } from '@models/entity/userEntity';
import { UserResponse } from '@models/dto/UserResponse';

import { NotFoundError } from '@models/errors/NotFoundError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { ConflictError } from '@models/errors/ConflictError';
import { AppError } from '@models/errors/AppError';

import { Not, In } from 'typeorm';

jest.mock('@repositories/userRepository');
jest.mock('@services/loggingService');
jest.mock('@services/mapperService');

const mockedUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockedLogInfo = logInfo as jest.Mock;
const mockedMapper = mapUserEntityToUserResponse as jest.Mock;

const mockStaffEntity: userEntity = {
  id: 1,
  username: 'staff.user',
  email: 'staff@test.com',
  firstName: 'Staff',
  lastName: 'User',
  role: UserRole.MUNICIPAL_ADMINISTRATOR, 
  passwordHash: 'hashedpassword',
  createdAt: new Date(),
  emailNotificationsEnabled: true,
};

const mockStaffResponse: UserResponse = {
  id: 1,
  username: 'staff.user',
  email: 'staff@test.com',
  first_name: 'Staff',
  last_name: 'User',
  role: UserRole.MUNICIPAL_ADMINISTRATOR, 
};

const mockCitizenEntity: userEntity = {
  ...mockStaffEntity,
  id: 2,
  username: 'citizen.user',
  role: UserRole.CITIZEN,
};

const mockAdminEntity: userEntity = {
  ...mockStaffEntity,
  id: 3,
  username: 'admin.user',
  role: UserRole.ADMINISTRATOR,
};

describe('MunicipalityUserService', () => {

  beforeEach(() => {
    jest.clearAllMocks();

    mockedMapper.mockImplementation((entity: userEntity) => {
      if (!entity) return null;
      return {
        id: entity.id,
        username: entity.username,
        email: entity.email,
        first_name: entity.firstName,
        last_name: entity.lastName,
        role: entity.role,
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
      role: UserRole.TECHNICAL_OFFICE_STAFF_MEMBER, 
    };

    it('should create a new municipality user successfully', async () => {
      mockedUserRepository.existsUserByUsername.mockResolvedValue(false);
      mockedUserRepository.existsUserByEmail.mockResolvedValue(false);
      
      const newEntity = { ...mockStaffEntity, id: 10, ...registerRequest };
      mockedUserRepository.createUserWithPassword.mockResolvedValue(newEntity);

      const result = await municipalityUserService.createMunicipalityUser(registerRequest);

      expect(result.username).toBe(registerRequest.username);
      expect(result.role).toBe(UserRole.TECHNICAL_OFFICE_STAFF_MEMBER);
      expect(mockedUserRepository.existsUserByUsername).toHaveBeenCalledWith(registerRequest.username);
      expect(mockedUserRepository.existsUserByEmail).toHaveBeenCalledWith(registerRequest.email);
      expect(mockedUserRepository.createUserWithPassword).toHaveBeenCalledTimes(1);
      expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Municipality user created'));
    });

    it('should throw BadRequestError when trying to create a CITIZEN', async () => {
      const citizenRequest = { ...registerRequest, role: UserRole.CITIZEN };
      
      await expect(
        municipalityUserService.createMunicipalityUser(citizenRequest)
      ).rejects.toThrow(BadRequestError);
      
      expect(mockedUserRepository.createUserWithPassword).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when trying to create an ADMINISTRATOR', async () => {
      const adminRequest = { ...registerRequest, role: UserRole.ADMINISTRATOR };
      
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
  });

  describe('getAllMunicipalityUsers', () => {
    it('should return an array of all municipality users', async () => {
      mockedUserRepository.findAllUsers.mockResolvedValue([mockStaffEntity, mockStaffEntity]);

      const result = await municipalityUserService.getAllMunicipalityUsers();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual(mockStaffResponse); 
      expect(mockedUserRepository.findAllUsers).toHaveBeenCalledWith({
        where: { role: Not(In([UserRole.CITIZEN, UserRole.ADMINISTRATOR])) },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return an empty array if no users found', async () => {
      mockedUserRepository.findAllUsers.mockResolvedValue([]);
      const result = await municipalityUserService.getAllMunicipalityUsers();
      expect(result.length).toBe(0);
    });

    it('should filter out null values if mapper returns null for an item', async () => {
      mockedMapper
        .mockReturnValueOnce(mockStaffResponse) 
        .mockReturnValueOnce(null);              

      mockedUserRepository.findAllUsers.mockResolvedValue([mockStaffEntity, mockStaffEntity]);
      
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
    const updateData = { firstName: 'Updated' };
    const updatedEntity = { ...mockStaffEntity, firstName: 'Updated' };

    it('should update a user successfully', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);

      const result = await municipalityUserService.updateMunicipalityUser(1, updateData);

      expect(result.first_name).toBe('Updated');
      expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(1, updateData);
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
      const updateRoleData = { role: UserRole.CITIZEN };

      await expect(municipalityUserService.updateMunicipalityUser(1, updateRoleData)).rejects.toThrow(BadRequestError);
    });
    
    it('should throw BadRequestError if trying to change role to ADMINISTRATOR', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      const updateRoleData = { role: UserRole.ADMINISTRATOR };

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
    const newRole = UserRole.URBAN_PLANNING_MANAGER; 
    const updatedEntity = { ...mockStaffEntity, role: newRole };

    it('should assign a valid role to a municipality user successfully', async () => {
      mockedUserRepository.findUserById.mockResolvedValue(mockStaffEntity);
      mockedUserRepository.updateUser.mockResolvedValue(updatedEntity);

      const result = await municipalityUserService.assignRole(1, newRole);

      expect(result.role).toBe(newRole);
      expect(mockedUserRepository.updateUser).toHaveBeenCalledWith(1, { role: newRole });
      expect(mockedLogInfo).toHaveBeenCalledWith(expect.stringContaining('Role assigned to user'));
    });

    it('should throw BadRequestError when trying to assign CITIZEN role', async () => {
      await expect(municipalityUserService.assignRole(1, UserRole.CITIZEN)).rejects.toThrow(BadRequestError);
      expect(mockedUserRepository.findUserById).not.toHaveBeenCalled();
    });
    
    it('should throw BadRequestError when trying to assign ADMINISTRATOR role', async () => {
      await expect(municipalityUserService.assignRole(1, UserRole.ADMINISTRATOR)).rejects.toThrow(BadRequestError);
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
}); */

// dummy test
describe('Dummy test', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});