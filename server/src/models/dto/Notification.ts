/**
 * Interfaccia Notification (tabella notifications)
 */
export interface Notification {
  id: number;
  user_id: number;
  report_id?: number;  // Opzionale
  content: string;
  is_read: boolean;
  created_at: Date;
}