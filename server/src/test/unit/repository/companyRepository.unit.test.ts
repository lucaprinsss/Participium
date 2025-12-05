import { companyRepository, Company } from '@repositories/companyRepository';
import { AppDataSource } from '@database/connection';

jest.mock('@database/connection', () => ({
    AppDataSource: {
        query: jest.fn(),
    },
}));

describe('CompanyRepository', () => {
    let mockedQuery: jest.Mock;

    beforeEach(() => {
        mockedQuery = AppDataSource.query as jest.Mock;
        mockedQuery.mockReset();
    });

    describe('findByName', () => {
        it('should return a company when found', async () => {
            const company: Company = { id: 1, name: 'Test Company', category: 'Test Category', createdAt: new Date() };
            mockedQuery.mockResolvedValue([company]);

            const result = await companyRepository.findByName('Test Company');

            expect(result).toEqual(company);
            expect(mockedQuery).toHaveBeenCalledWith(
                'SELECT id, name, category, created_at as "createdAt" FROM companies WHERE name = $1',
                ['Test Company']
            );
        });

        it('should return null when not found', async () => {
            mockedQuery.mockResolvedValue([]);

            const result = await companyRepository.findByName('Non-existent Company');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return a company when found', async () => {
            const company: Company = { id: 1, name: 'Test Company', category: 'Test Category', createdAt: new Date() };
            mockedQuery.mockResolvedValue([company]);

            const result = await companyRepository.findById(1);

            expect(result).toEqual(company);
            expect(mockedQuery).toHaveBeenCalledWith(
                'SELECT id, name, category, created_at as "createdAt" FROM companies WHERE id = $1',
                [1]
            );
        });

        it('should return null when not found', async () => {
            mockedQuery.mockResolvedValue([]);

            const result = await companyRepository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return an array of companies', async () => {
            const companies: Company[] = [
                { id: 1, name: 'Company A', category: 'Category A', createdAt: new Date() },
                { id: 2, name: 'Company B', category: 'Category B', createdAt: new Date() },
            ];
            mockedQuery.mockResolvedValue(companies);

            const result = await companyRepository.findAll();

            expect(result).toEqual(companies);
            expect(mockedQuery).toHaveBeenCalledWith(
                'SELECT id, name, category, created_at as "createdAt" FROM companies ORDER BY name'
            );
        });

        it('should return an empty array when no companies are found', async () => {
            mockedQuery.mockResolvedValue([]);

            const result = await companyRepository.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('create', () => {
        it('should return the created company', async () => {
            const newCompany: Company = { id: 1, name: 'New Company', category: 'New Category', createdAt: new Date() };
            mockedQuery.mockResolvedValue([newCompany]);

            const result = await companyRepository.create('New Company', 'New Category');

            expect(result).toEqual(newCompany);
            expect(mockedQuery).toHaveBeenCalledWith(
                'INSERT INTO companies (name, category) VALUES ($1, $2) RETURNING id, name, category, created_at as "createdAt"',
                ['New Company', 'New Category']
            );
        });
    });

    describe('existsByName', () => {
        it('should return true if a company exists', async () => {
            mockedQuery.mockResolvedValue([{ exists: true }]);

            const result = await companyRepository.existsByName('Existing Company');

            expect(result).toBe(true);
            expect(mockedQuery).toHaveBeenCalledWith(
                'SELECT EXISTS(SELECT 1 FROM companies WHERE name = $1) as exists',
                ['Existing Company']
            );
        });

        it('should return false if a company does not exist', async () => {
            mockedQuery.mockResolvedValue([{ exists: false }]);

            const result = await companyRepository.existsByName('Non-existent Company');

            expect(result).toBe(false);
        });
    });

    describe('isValidCategory', () => {
        it('should return true if the category is valid', async () => {
            mockedQuery.mockResolvedValue([{ exists: true }]);

            const result = await companyRepository.isValidCategory('Valid Category');

            expect(result).toBe(true);
            expect(mockedQuery).toHaveBeenCalledWith(
                'SELECT EXISTS(SELECT 1 FROM report_categories WHERE category = $1) as exists',
                ['Valid Category']
            );
        });

        it('should return false if the category is not valid', async () => {
            mockedQuery.mockResolvedValue([{ exists: false }]);

            const result = await companyRepository.isValidCategory('Invalid Category');

            expect(result).toBe(false);
        });
    });
});
