import { ReportCategory } from './ReportCategory';

/**
 * Category Department Mapping Interface
 * Maps report categories to responsible departments for automatic assignment
 */
export interface CategoryDepartmentMapping {
  id: number;
  category: ReportCategory;
  departmentId: number;
  createdAt: Date;
}
