import { RoleUtils } from '@utils/roleUtils';
import { roleRepository } from '@repositories/roleRepository';
import { departmentRoleRepository } from '@repositories/departmentRoleRepository';

jest.mock('@repositories/roleRepository');
jest.mock('@repositories/departmentRoleRepository');

const mockedRoleRepository = roleRepository as jest.Mocked<typeof roleRepository>;
const mockedDepartmentRoleRepository = departmentRoleRepository as jest.Mocked<typeof departmentRoleRepository>;

describe('RoleUtils Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllRoles', () => {
    it('should return all role names', async () => {
      mockedRoleRepository.findAll.mockResolvedValue([
        { id: 1, name: 'Citizen' } as any,
        { id: 2, name: 'Administrator' } as any,
        { id: 3, name: 'Manager' } as any,
      ]);

      const roles = await RoleUtils.getAllRoles();

      expect(roles).toEqual(['Citizen', 'Administrator', 'Manager']);
      expect(mockedRoleRepository.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no roles exist', async () => {
      mockedRoleRepository.findAll.mockResolvedValue([]);

      const roles = await RoleUtils.getAllRoles();

      expect(roles).toEqual([]);
    });
  });

  describe('getAllMunicipalityRoles', () => {
    it('should return municipality role names', async () => {
      mockedRoleRepository.findMunicipalityRoles.mockResolvedValue([
        { id: 3, name: 'Manager' } as any,
        { id: 4, name: 'Technician' } as any,
      ]);

      const roles = await RoleUtils.getAllMunicipalityRoles();

      expect(roles).toEqual(['Manager', 'Technician']);
      expect(mockedRoleRepository.findMunicipalityRoles).toHaveBeenCalled();
    });

    it('should return empty array when no municipality roles exist', async () => {
      mockedRoleRepository.findMunicipalityRoles.mockResolvedValue([]);

      const roles = await RoleUtils.getAllMunicipalityRoles();

      expect(roles).toEqual([]);
    });
  });

  describe('getAllMunicipalityDepartmentRoles', () => {
    it('should return municipality department roles', async () => {
      mockedDepartmentRoleRepository.findMunicipalityDepartmentRoles.mockResolvedValue([
        {
          id: 1,
          department: { id: 1, name: 'Public Works' } as any,
          role: { id: 3, name: 'Manager' } as any,
        } as any,
        {
          id: 2,
          department: { id: 2, name: 'IT' } as any,
          role: { id: 4, name: 'Technician' } as any,
        } as any,
      ]);

      const departmentRoles = await RoleUtils.getAllMunicipalityDepartmentRoles();

      expect(departmentRoles).toEqual([
        { id: 1, department: 'Public Works', role: 'Manager' },
        { id: 2, department: 'IT', role: 'Technician' },
      ]);
      expect(mockedDepartmentRoleRepository.findMunicipalityDepartmentRoles).toHaveBeenCalled();
    });

    it('should handle missing department or role names', async () => {
      mockedDepartmentRoleRepository.findMunicipalityDepartmentRoles.mockResolvedValue([
        {
          id: 1,
          department: null,
          role: null,
        } as any,
      ]);

      const departmentRoles = await RoleUtils.getAllMunicipalityDepartmentRoles();

      expect(departmentRoles).toEqual([
        { id: 1, department: '', role: '' },
      ]);
    });

    it('should return empty array when no department roles exist', async () => {
      mockedDepartmentRoleRepository.findMunicipalityDepartmentRoles.mockResolvedValue([]);

      const departmentRoles = await RoleUtils.getAllMunicipalityDepartmentRoles();

      expect(departmentRoles).toEqual([]);
    });
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

  describe('getDepartmentRoleId', () => {
    it('should return department role ID for valid department and role', async () => {
      mockedDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue({
        id: 10,
        department: { id: 1, name: 'Public Works' } as any,
        role: { id: 3, name: 'Manager' } as any,
      } as any);

      const id = await RoleUtils.getDepartmentRoleId('Public Works', 'Manager');

      expect(id).toBe(10);
      expect(mockedDepartmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith('Public Works', 'Manager');
    });

    it('should return null for non-existent department role', async () => {
      mockedDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue(null);

      const id = await RoleUtils.getDepartmentRoleId('NonExistent', 'Role');

      expect(id).toBeNull();
      expect(mockedDepartmentRoleRepository.findByDepartmentAndRole).toHaveBeenCalledWith('NonExistent', 'Role');
    });

    it('should handle undefined department role', async () => {
      mockedDepartmentRoleRepository.findByDepartmentAndRole.mockResolvedValue(undefined as any);

      const id = await RoleUtils.getDepartmentRoleId('Department', 'Role');

      expect(id).toBeNull();
    });
  });
});
