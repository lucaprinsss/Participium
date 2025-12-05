import { Request, Response, NextFunction } from 'express';
import { companyService } from '@services/companyService';
import { CreateCompanyRequest } from '@models/dto/input/CreateCompanyRequest';

/**
 * Controller for Company management
 */
class CompanyController {
  /**
   * POST /api/companies
   * Create new company (Admin only)
   */
  async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, category } = req.body;

      const createData: CreateCompanyRequest = {
        name,
        category
      };

      const companyResponse = await companyService.createCompany(createData);

      res.status(201).json(companyResponse);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/companies
   * List all companies (Admin only)
   */
  async getAllCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const companies = await companyService.getAllCompanies();
      res.status(200).json(companies);
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();
