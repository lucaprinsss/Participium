/**
 * Response DTO for a comment
 */
export interface CommentResponse {
  id: number;
  reportId: number;
  author: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    personalPhotoUrl?: string;
  };
  content: string;
  createdAt: Date;
}
