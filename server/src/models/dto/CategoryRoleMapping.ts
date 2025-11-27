import { ReportCategory } from './ReportCategory';

/**
 * Category Role Mapping Interface
 * Maps report categories to specific technical roles for automatic assignment
 */
export interface CategoryRoleMapping {
  id: number;
  category: ReportCategory;
  roleId: number;
  roleName?: string; // Optional: include role name for frontend display
  createdAt: Date;
}