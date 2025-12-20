/**
 * Response DTO for a message
 */
export interface MessageResponse {
  id: number;
  reportId: number;
  author: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  content: string;
  createdAt: Date;
}
