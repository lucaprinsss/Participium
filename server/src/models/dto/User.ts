/**
 * User interface (users table)
 */
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  department_role_id: number;
  email: string;
  personal_photo_url?: string;  // Optional field (can be null)
  telegram_username?: string;   // Optional field
  email_notifications_enabled: boolean;
  created_at: Date;
}