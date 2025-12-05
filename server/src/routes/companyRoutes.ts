import { Router } from 'express';
import { companyController } from '@controllers/companyController';
import { isLoggedIn, requireRole } from '@middleware/authMiddleware';
import { SystemRoles } from '@models/dto/UserRole';

const router = Router();

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Create a new external maintenance company
 *     description: Administrator can create a new company and assign it to a report category. Multiple companies can handle the same category, but each company can only have one category.
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompanyRequest'
 *     responses:
 *       201:
 *         description: Company created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyResponse'
 *       400:
 *         description: Invalid category or missing required fields
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin role required
 *       409:
 *         description: Company name already exists
 */
router.post(
  '/',
  isLoggedIn,
  requireRole(SystemRoles.ADMINISTRATOR),
  companyController.createCompany
);

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve a list of all external maintenance companies with their assigned categories
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CompanyResponse'
 *       401:
 *         description: Unauthorized - authentication required
 *       403:
 *         description: Forbidden - admin role required
 */
router.get(
  '/',
  isLoggedIn,
  requireRole(SystemRoles.ADMINISTRATOR),
  companyController.getAllCompanies
);

export default router;
