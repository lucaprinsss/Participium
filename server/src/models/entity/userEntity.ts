import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { DepartmentRoleEntity } from "./departmentRoleEntity";

@Entity("users")
export class UserEntity implements Express.User {
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

  @Column({ name: "department_role_id" })
  departmentRoleId!: number;

  @ManyToOne(() => DepartmentRoleEntity, (departmentRole) => departmentRole.users, {
    eager: true
  })
  @JoinColumn({ name: "department_role_id" })
  departmentRole!: DepartmentRoleEntity;

  @Column({ length: 255, unique: true })
  email!: string;

  @Column({ type: "text", nullable: true })
  personalPhotoUrl?: string;

  @Column({ length: 100, unique: true, nullable: true })
  telegramUsername?: string;

  @Column({ default: true })
  emailNotificationsEnabled!: boolean;

  @Column({ name: "company_id", nullable: true })
  companyId?: number;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ length: 6, nullable: true })
  verificationCode?: string;

  @Column({ type: "timestamptz", nullable: true })
  verificationCodeExpiresAt?: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
