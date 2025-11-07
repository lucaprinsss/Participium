/**
 * Notification interface (notifications table)
 */
export interface Notification {
  id: number;
  user_id: number;
  report_id?: number;  // Optional field
  content: string;
  is_read: boolean;
  created_at: Date;
}