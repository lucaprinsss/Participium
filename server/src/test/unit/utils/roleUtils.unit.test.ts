import { RoleUtils } from '@utils/roleUtils';
import { roleRepository } from '@repositories/roleRepository';
import { UserEntity } from '@models/entity/userEntity';

jest.mock('@repositories/roleRepository');

const mockedRoleRepository = roleRepository as jest.Mocked<typeof roleRepository>;

describe('RoleUtils Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isRoleValid', () => {
    it('should return true for valid role', async () => {
      mockedRoleRepository.findByName.mockResolvedValue({ id: 1, name: 'Citizen' } as any);

      const isValid = await RoleUtils.isRoleValid('Citizen');

      expect(isValid).toBe(true);
      expect(mockedRoleRepository.findByName).toHaveBeenCalledWith('Citizen');
    });

    it('should return false for invalid role', async () => {
      mockedRoleRepository.findByName.mockResolvedValue(null);

      const isValid = await RoleUtils.isRoleValid('InvalidRole');

      expect(isValid).toBe(false);
      expect(mockedRoleRepository.findByName).toHaveBeenCalledWith('InvalidRole');
    });
  });

  describe('getUserRoleNames', () => {
    it('should return all role names for a user', () => {
      const user = {
        userRoles: [
          {
            departmentRole: {
              role: { name: 'Administrator' },
              department: { name: 'Organization' }
            }
          },
          {
            departmentRole: {
              role: { name: 'Water Network staff member' },
              department: { name: 'Water and Sewer Services Department' }
            }
          }
        ]
      } as any as UserEntity;

      const roles = RoleUtils.getUserRoleNames(user);

      expect(roles).toEqual(['Administrator', 'Water Network staff member']);
    });

    it('should return empty array when user has no roles', () => {
      const user = { userRoles: [] } as any as UserEntity;

      const roles = RoleUtils.getUserRoleNames(user);

      expect(roles).toEqual([]);
    });

    it('should filter out empty role names', () => {
      const user = {
        userRoles: [
          {
            departmentRole: {
              role: null,
              department: { name: 'Organization' }
            }
          }
        ]
      } as any as UserEntity;

      const roles = RoleUtils.getUserRoleNames(user);

      expect(roles).toEqual([]);
    });
  });

  describe('getUserDepartmentNames', () => {
    it('should return all department names for a user', () => {
      const user = {
        userRoles: [
          {
            departmentRole: {
              role: { name: 'Administrator' },
              department: { name: 'Organization' }
            }
          },
          {
            departmentRole: {
              role: { name: 'Water Network staff member' },
              department: { name: 'Water and Sewer Services Department' }
            }
          }
        ]
      } as any as UserEntity;

      const departments = RoleUtils.getUserDepartmentNames(user);

      expect(departments).toEqual(['Organization', 'Water and Sewer Services Department']);
    });

    it('should return empty array when user has no roles', () => {
      const user = { userRoles: [] } as any as UserEntity;

      const departments = RoleUtils.getUserDepartmentNames(user);

      expect(departments).toEqual([]);
    });
  });

  describe('userHasRole', () => {
    it('should return true when user has the specific role', () => {
      const user = {
        userRoles: [
          {
            departmentRole: {
              role: { name: 'Administrator' },
              department: { name: 'Organization' }
            }
          }
        ]
      } as any as UserEntity;

      const hasRole = RoleUtils.userHasRole(user, 'Administrator');

      expect(hasRole).toBe(true);
    });

    it('should return false when user does not have the specific role', () => {
      const user = {
        userRoles: [
          {
            departmentRole: {
              role: { name: 'Citizen' },
              department: { name: 'Organization' }
            }
          }
        ]
      } as any as UserEntity;

      const hasRole = RoleUtils.userHasRole(user, 'Administrator');

      expect(hasRole).toBe(false);
    });

    it('should return false when user has no roles', () => {
      const user = { userRoles: [] } as any as UserEntity;

      const hasRole = RoleUtils.userHasRole(user, 'Administrator');

      expect(hasRole).toBe(false);
    });
  });

  describe('userInDepartment', () => {
    it('should return true when user works in the specific department', () => {
      const user = {
        userRoles: [
          {
            departmentRole: {
              role: { name: 'Water Network staff member' },
              department: { name: 'Water and Sewer Services Department' }
            }
          }
        ]
      } as any as UserEntity;

      const inDepartment = RoleUtils.userInDepartment(user, 'Water and Sewer Services Department');

      expect(inDepartment).toBe(true);
    });

    it('should return false when user does not work in the specific department', () => {
      const user = {
        userRoles: [
          {
            departmentRole: {
              role: { name: 'Citizen' },
              department: { name: 'Organization' }
            }
          }
        ]
      } as any as UserEntity;

      const inDepartment = RoleUtils.userInDepartment(user, 'Water and Sewer Services Department');

      expect(inDepartment).toBe(false);
    });

    it('should return false when user has no roles', () => {
      const user = { userRoles: [] } as any as UserEntity;

      const inDepartment = RoleUtils.userInDepartment(user, 'Water and Sewer Services Department');

      expect(inDepartment).toBe(false);
    });
  });
});
