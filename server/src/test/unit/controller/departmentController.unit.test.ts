import { getMockReq, getMockRes } from '@jest-mock/express';
import DepartmentController from '@controllers/departmentController';
import { departmentService } from '@services/departmentService';
import { AppError } from '@models/errors/AppError';
import { BadRequestError } from '@models/errors/BadRequestError';

// Mock the departmentService
jest.mock('@services/departmentService', () => ({
  departmentService: {
    getMunicipalityDepartments: jest.fn(),
    getRolesByDepartment: jest.fn(),
  },
}));

describe('DepartmentController', () => {
  const { res, next, mockClear } = getMockRes();

  beforeEach(() => {
    mockClear();
  });

  describe('getMunicipalityDepartments', () => {
    it('should return departments and a 200 status code', async () => {
      const mockDepartments = [{ id: 1, name: 'Test Department' }];
      (departmentService.getMunicipalityDepartments as jest.Mock).mockResolvedValue(mockDepartments);

      const req = getMockReq();
      await DepartmentController.getMunicipalityDepartments(req as any, res as any, next);

      expect(departmentService.getMunicipalityDepartments).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDepartments);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with an error if service throws', async () => {
      const mockError = new AppError('Test Error', 500);
      (departmentService.getMunicipalityDepartments as jest.Mock).mockRejectedValue(mockError);

      const req = getMockReq();
      await DepartmentController.getMunicipalityDepartments(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('getRolesByDepartment', () => {
    it('should return roles and a 200 status code for a valid department ID', async () => {
      const mockRoles = [{ id: 1, name: 'Test Role' }];
      (departmentService.getRolesByDepartment as jest.Mock).mockResolvedValue(mockRoles);

      const req = getMockReq({ params: { id: '1' } });
      await DepartmentController.getRolesByDepartment(req as any, res as any, next);

      expect(departmentService.getRolesByDepartment).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockRoles);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with a BadRequestError for an invalid department ID', async () => {
      const req = getMockReq({ params: { id: 'invalid' } });
      await DepartmentController.getRolesByDepartment(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should call next with an error if service throws', async () => {
      const mockError = new AppError('Test Error', 500);
      (departmentService.getRolesByDepartment as jest.Mock).mockRejectedValue(mockError);

      const req = getMockReq({ params: { id: '1' } });
      await DepartmentController.getRolesByDepartment(req as any, res as any, next);

      expect(next).toHaveBeenCalledWith(mockError);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});