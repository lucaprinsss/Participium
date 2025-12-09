import { companyRepository, Company } from '@repositories/companyRepository';
import { AppDataSource } from '@database/connection';

// Create a mock query builder with chainable methods
const createMockQueryBuilder = () => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    getRawOne: jest.fn(),
    getRawMany: jest.fn()
  };
  return builder;
};

jest.mock('@database/connection', () => ({
    AppDataSource: {
        query: jest.fn(),
        createQueryBuilder: jest.fn()
    },
}));

describe('CompanyRepository', () => {
    let mockedQuery: jest.Mock;
    let mockQueryBuilder: any;

    beforeEach(() => {
        mockedQuery = AppDataSource.query as jest.Mock;
        mockQueryBuilder = createMockQueryBuilder();
        (AppDataSource.createQueryBuilder as jest.Mock).mockReturnValue(mockQueryBuilder);
        
        mockedQuery.mockReset();
    });

    describe('findByName', () => {
        it('should return a company when found', async () => {
            const company: Company = { id: 1, name: 'Test Company', category: 'Test Category', createdAt: new Date() };
            mockQueryBuilder.getRawOne.mockResolvedValue(company);

            const result = await companyRepository.findByName('Test Company');

            expect(result).toEqual(company);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('c.name = :name', { name: 'Test Company' });
        });

        it('should return null when not found', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue(null);

            const result = await companyRepository.findByName('Non-existent Company');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return a company when found', async () => {
            const company: Company = { id: 1, name: 'Test Company', category: 'Test Category', createdAt: new Date() };
            mockQueryBuilder.getRawOne.mockResolvedValue(company);

            const result = await companyRepository.findById(1);

            expect(result).toEqual(company);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('c.id = :id', { id: 1 });
        });

        it('should return null when not found', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue(null);

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
            mockQueryBuilder.getRawMany.mockResolvedValue(companies);

            const result = await companyRepository.findAll();

            expect(result).toEqual(companies);
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('LOWER(c.name)', 'ASC');
        });

        it('should return an empty array when no companies are found', async () => {
            mockQueryBuilder.getRawMany.mockResolvedValue([]);

            const result = await companyRepository.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('create', () => {
        it('should return the created company', async () => {
            const rawResult = { id: 1, name: 'New Company', category: 'New Category', created_at: new Date() };
            mockQueryBuilder.execute.mockResolvedValue({ raw: [rawResult] });

            const result = await companyRepository.create('New Company', 'New Category');

            expect(result.id).toBe(1);
            expect(result.name).toBe('New Company');
            expect(result.category).toBe('New Category');
            expect(mockQueryBuilder.insert).toHaveBeenCalled();
            expect(mockQueryBuilder.values).toHaveBeenCalledWith({ name: 'New Company', category: 'New Category' });
        });
    });

    describe('existsByName', () => {
        it('should return true if a company exists', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ count: '1' });

            const result = await companyRepository.existsByName('Existing Company');

            expect(result).toBe(true);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('c.name = :name', { name: 'Existing Company' });
        });

        it('should return false if a company does not exist', async () => {
            mockQueryBuilder.getRawOne.mockResolvedValue({ count: '0' });

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
                `SELECT EXISTS(
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'report_category' AND e.enumlabel = $1
      ) as exists`,
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
