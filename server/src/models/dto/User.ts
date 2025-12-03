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
  company_name?: string;        // V4.3: Optional field for External Maintainers
  is_verified: boolean;         // V4.4: Email verification status
  verification_code?: string;   // V4.4: 6-digit verification code (null after verification)
  verification_code_expires_at?: Date;  // V4.4: Code expiration timestamp
  created_at: Date;
}