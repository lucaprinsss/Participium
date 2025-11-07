/**
 * Interfaccia Message (tabella messages)
 */
export interface Message {
  id: number;
  report_id: number;
  sender_id: number;
  content: string;
  created_at: Date;
}