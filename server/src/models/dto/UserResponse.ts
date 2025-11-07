import { UserRole } from "./UserRole"

export interface UserResponse{
    id: number, 
    username: string, 
    email: string, 
    first_name: string, 
    last_name: string, 
    role: UserRole
}