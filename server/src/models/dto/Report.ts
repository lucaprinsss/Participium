import { ReportCategory } from "./ReportCategory";
import { ReportStatus } from "./ReportStatus";

/**
 * Interfaccia Report (tabella reports)
 * Rappresenta una segnalazione
 */
export interface Report {
  id: number;
  reporter_id: number;
  title: string;
  description: string;
  category: ReportCategory;
  location: any;  // PostGIS Geography type (complesso, lo tipizziamo dopo)
  is_anonymous: boolean;
  status: ReportStatus;
  rejection_reason?: string;  // Opzionale (solo se status = Rejected)
  assignee_id?: number;       // Opzionale (solo se assegnato)
  created_at: Date;
  updated_at: Date;
}