import { companyService } from '@services/companyService';
import { companyRepository } from '@repositories/companyRepository';
import { CreateCompanyRequest } from '@models/dto/input/CreateCompanyRequest';
import { BadRequestError } from '@models/errors/BadRequestError';
import { ConflictError } from '@models/errors/ConflictError';
import { logInfo } from '@services/loggingService';

// Mock dependencies
jest.mock('@repositories/companyRepository');
jest.mock('@services/loggingService');

describe('CompanyService', () => {
    const mockCompanyRepository = companyRepository as jest.Mocked<typeof companyRepository>;
    const mockLogInfo = logInfo as jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createCompany', () => {
        const createData: CreateCompanyRequest = {
            name: 'New Company',
            category: 'Road Maintenance',
        };

        it('should create a company successfully', async () => {
            const createdCompany = { id: 1, name: createData.name, category: createData.category, createdAt: new Date() };

            mockCompanyRepository.isValidCategory.mockResolvedValue(true);
            mockCompanyRepository.existsByName.mockResolvedValue(false);
            mockCompanyRepository.create.mockResolvedValue(createdCompany);

            const result = await companyService.createCompany(createData);

            expect(mockCompanyRepository.isValidCategory).toHaveBeenCalledWith(createData.category);
            expect(mockCompanyRepository.existsByName).toHaveBeenCalledWith(createData.name);
            expect(mockCompanyRepository.create).toHaveBeenCalledWith(createData.name, createData.category);
            expect(mockLogInfo).toHaveBeenCalledWith(`Company created: ${createData.name} for category ${createData.category}`);
            expect(result).toEqual({
                id: createdCompany.id,
                name: createdCompany.name,
                category: createdCompany.category,
                created_at: createdCompany.createdAt,
            });
        });

        it('should throw BadRequestError for an invalid category', async () => {
            mockCompanyRepository.isValidCategory.mockResolvedValue(false);

            await expect(companyService.createCompany(createData)).rejects.toThrow(BadRequestError);
            expect(mockCompanyRepository.existsByName).not.toHaveBeenCalled();
            expect(mockCompanyRepository.create).not.toHaveBeenCalled();
        });

        it('should throw ConflictError if company name already exists', async () => {
            mockCompanyRepository.isValidCategory.mockResolvedValue(true);
            mockCompanyRepository.existsByName.mockResolvedValue(true);

            await expect(companyService.createCompany(createData)).rejects.toThrow(ConflictError);
            expect(mockCompanyRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('getAllCompanies', () => {
        it('should return an array of companies', async () => {
            const companies = [
                { id: 1, name: 'Company A', category: 'Category A', createdAt: new Date() },
                { id: 2, name: 'Company B', category: 'Category B', createdAt: new Date() },
            ];
            mockCompanyRepository.findAll.mockResolvedValue(companies);

            const result = await companyService.getAllCompanies();

            expect(mockCompanyRepository.findAll).toHaveBeenCalled();
            expect(mockLogInfo).toHaveBeenCalledWith(`Retrieved ${companies.length} companies`);
            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                id: companies[0].id,
                name: companies[0].name,
                category: companies[0].category,
                created_at: companies[0].createdAt,
            });
        });

        it('should return an empty array if no companies are found', async () => {
            mockCompanyRepository.findAll.mockResolvedValue([]);

            const result = await companyService.getAllCompanies();

            expect(result).toEqual([]);
            expect(mockLogInfo).toHaveBeenCalledWith('Retrieved 0 companies');
        });
    });
});
