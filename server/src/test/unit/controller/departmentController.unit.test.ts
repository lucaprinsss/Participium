import DepartmentController from '@controllers/departmentController';
import { departmentService } from '@services/departmentService';
import { Request, Response, NextFunction } from 'express';

// Mock departmentService
jest.mock('@services/departmentService', () => ({
    departmentService: {
        getMunicipalityDepartments: jest.fn(),
        getRolesByDepartment: jest.fn(),
        getAllMunicipalityDepartmentRoles: jest.fn()
    }
}));

describe('DepartmentController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('getMunicipalityDepartments', () => {
        it('should return 200 and departments list', async () => {
            const mockDepartments = [{ id: 1, name: 'Dep1' }];
            (departmentService.getMunicipalityDepartments as jest.Mock).mockResolvedValue(mockDepartments);

            await DepartmentController.getMunicipalityDepartments(req as Request, res as Response, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockDepartments);
        });

        it('should call next with error if service fails', async () => {
            const error = new Error('Service Error');
            (departmentService.getMunicipalityDepartments as jest.Mock).mockRejectedValue(error);

            await DepartmentController.getMunicipalityDepartments(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getRolesByDepartment', () => {
        it('should return 200 and roles list if department id is valid', async () => {
            req.params = { id: '1' };
            const mockRoles = [{ id: 1, name: 'Role1' }];
            (departmentService.getRolesByDepartment as jest.Mock).mockResolvedValue(mockRoles);

            await DepartmentController.getRolesByDepartment(req as Request, res as Response, next);

            expect(departmentService.getRolesByDepartment).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRoles);
        });

        it('should call next with error if id is invalid', async () => {
            req.params = { id: 'invalid' };

            await DepartmentController.getRolesByDepartment(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled(); // parseAndValidateId throws error
        });

        it('should call next with error if service fails', async () => {
            req.params = { id: '1' };
            const error = new Error('Service Error');
            (departmentService.getRolesByDepartment as jest.Mock).mockRejectedValue(error);

            await DepartmentController.getRolesByDepartment(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getDepartmentRolesMapping', () => {
        it('should return 200 and department roles mapping', async () => {
            const mockMapping = [
                {
                    departmentId: 2,
                    departmentName: 'Water and Sewer Services Department',
                    roles: [
                        { id: 4, name: 'Department Director' },
                        { id: 5, name: 'Water Network staff member' }
                    ]
                },
                {
                    departmentId: 3,
                    departmentName: 'Public Infrastructure Department',
                    roles: [
                        { id: 4, name: 'Department Director' },
                        { id: 7, name: 'Road Maintenance staff member' }
                    ]
                }
            ];
            (departmentService.getAllMunicipalityDepartmentRoles as jest.Mock).mockResolvedValue(mockMapping);

            await DepartmentController.getDepartmentRolesMapping(req as Request, res as Response, next);

            expect(departmentService.getAllMunicipalityDepartmentRoles).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockMapping);
        });

        it('should call next with error if service fails', async () => {
            const error = new Error('Service Error');
            (departmentService.getAllMunicipalityDepartmentRoles as jest.Mock).mockRejectedValue(error);

            await DepartmentController.getDepartmentRolesMapping(req as Request, res as Response, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});
