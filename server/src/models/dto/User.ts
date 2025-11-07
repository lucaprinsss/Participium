import {UserRole} from "./UserRole";

/**
 * Interfaccia User (tabella users)
 * Rappresenta un utente registrato nel sistema
 */
export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  role: UserRole;
  email: string;
  personal_photo_url?: string;  // Opzionale (può essere null)
  telegram_username?: string;   // Opzionale
  email_notifications_enabled: boolean;
  created_at: Date;
}