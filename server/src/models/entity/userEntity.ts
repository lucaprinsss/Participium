import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("users")
export class userEntity implements Express.User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50, unique: true })
  username!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 255, select: false })
  passwordHash!: string;

  @Column({ 
    type: "enum", 
    enum: [
      "Citizen", 
      "Administrator", 
      "Municipal Public Relations Officer",
      "Municipal Administrator",
      "Technical Office Staff Member",
      "Urban Planning Manager",
      "Private Building Manager",
      "Infrastructure Manager",
      "Maintenance Staff Member",
      "Public Green Spaces Manager"
    ], 
    default: "Citizen" 
  })
  role!: string;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ type: "text", nullable: true })
  personalPhotoUrl?: string;

  @Column({ length: 100, unique: true, nullable: true })
  telegramUsername?: string;

  @Column({ default: true })
  emailNotificationsEnabled!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
