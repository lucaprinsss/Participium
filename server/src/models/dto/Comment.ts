/**
 * Interfaccia Comment (tabella comments)
 */
export interface Comment {
  id: number;
  report_id: number;
  author_id: number;
  content: string;
  created_at: Date;
}