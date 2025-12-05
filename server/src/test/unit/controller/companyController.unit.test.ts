import { Request, Response, NextFunction } from 'express';
import { companyController } from '@controllers/companyController';
import { companyService } from '@services/companyService';
import { CreateCompanyRequest } from '@models/dto/input/CreateCompanyRequest';
import { CompanyResponse } from '@models/dto/output/CompanyResponse';

jest.mock('@services/companyService');

describe('CompanyController', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createCompany', () => {
    it('should create a company and return 201 status', async () => {
      const createData: CreateCompanyRequest = { name: 'Test Company', category: 'Test Category' };
      const companyResponse: CompanyResponse = { id: 1, name: 'Test Company', category: 'Test Category', created_at: new Date() };
      req.body = createData;

      (companyService.createCompany as jest.Mock).mockResolvedValue(companyResponse);

      await companyController.createCompany(req as Request, res as Response, next);

      expect(companyService.createCompany).toHaveBeenCalledWith(createData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(companyResponse);
    });

    it('should call next with an error if company creation fails', async () => {
      const error = new Error('Creation failed');
      req.body = { name: 'Test Company', category: 'Test Category' };

      (companyService.createCompany as jest.Mock).mockRejectedValue(error);

      await companyController.createCompany(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getAllCompanies', () => {
    it('should get all companies and return 200 status', async () => {
      const companiesResponse: CompanyResponse[] = [
        { id: 1, name: 'Test Company 1', category: 'Test Category 1', created_at: new Date() },
        { id: 2, name: 'Test Company 2', category: 'Test Category 2', created_at: new Date() },
      ];

      (companyService.getAllCompanies as jest.Mock).mockResolvedValue(companiesResponse);

      await companyController.getAllCompanies(req as Request, res as Response, next);

      expect(companyService.getAllCompanies).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(companiesResponse);
    });

    it('should call next with an error if fetching all companies fails', async () => {
      const error = new Error('Fetch failed');

      (companyService.getAllCompanies as jest.Mock).mockRejectedValue(error);

      await companyController.getAllCompanies(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
