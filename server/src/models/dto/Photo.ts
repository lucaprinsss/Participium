/**
 * Interfaccia Photo (tabella photos)
 */
export interface Photo {
  id: number;
  report_id: number;
  storage_url: string;
  created_at: Date;
}