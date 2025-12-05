import { ReportCategory } from "./ReportCategory";
import { ReportStatus } from "./ReportStatus";

/**
 * Report interface (reports table)
 * Represents a report
 */
export interface Report {
  id: number;
  reporter_id: number;
  title: string;
  description: string;
  category: ReportCategory;
  location: any;              // PostGIS Geography type (complex to type strictly here)
  address?: string;           // Optional human-readable address
  is_anonymous: boolean;
  status: ReportStatus;
  rejection_reason?: string;  // Optional just if status is Rejected
  assignee_id?: number;       // Optional - internal staff member assigned
  external_assignee_id?: number;  // Optional - external maintainer assigned
  created_at: Date;
  updated_at: Date;
}