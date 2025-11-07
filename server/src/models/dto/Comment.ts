/**
 * Comment interface (comments table)
 */
export interface Comment {
  id: number;
  report_id: number;
  author_id: number;
  content: string;
  created_at: Date;
}