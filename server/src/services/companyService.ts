import { companyRepository } from '@repositories/companyRepository';
import { CreateCompanyRequest } from '@models/dto/input/CreateCompanyRequest';
import { CompanyResponse } from '@models/dto/output/CompanyResponse';
import { ConflictError } from '@models/errors/ConflictError';
import { BadRequestError } from '@models/errors/BadRequestError';
import { logInfo } from '@services/loggingService';

/**
 * Service for company management
 */
class CompanyService {

  /**
   * Create a new company
   * @param createData Company creation data
   * @returns The created company response
   * @throws BadRequestError if category is invalid
   * @throws ConflictError if company name already exists
   */
  async createCompany(createData: CreateCompanyRequest): Promise<CompanyResponse> {
    const { name, category } = createData;

    // Validate category exists in database
    const isValid = await companyRepository.isValidCategory(category);
    if (!isValid) {
      throw new BadRequestError(`Invalid category "${category}". Category does not exist in the system.`);
    }

    // Check if company name already exists
    const nameExists = await companyRepository.existsByName(name);
    if (nameExists) {
      throw new ConflictError(`Company "${name}" already exists`);
    }

    // Create company
    const company = await companyRepository.create(name, category);
    
    logInfo(`Company created: ${name} for category ${category}`);

    return {
      id: company.id,
      name: company.name,
      category: company.category,
      created_at: company.createdAt
    };
  }

  /**
   * Get all companies
   * @returns Array of company responses
   */
  async getAllCompanies(): Promise<CompanyResponse[]> {
    const companies = await companyRepository.findAll();
    
    logInfo(`Retrieved ${companies.length} companies`);
    
    return companies.map(company => ({
      id: company.id,
      name: company.name,
      category: company.category,
      created_at: company.createdAt
    }));
  }
}

export const companyService = new CompanyService();
