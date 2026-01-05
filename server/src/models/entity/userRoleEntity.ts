import { Entity, Unique, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from "typeorm";
import { DepartmentRoleEntity } from "./departmentRoleEntity";
import { UserEntity } from "./userEntity";

@Entity("user_roles")
@Unique(["userId", "departmentRoleId"])
export class UserRoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "user_id" })
  userId!: number;

  @Column({ name: "department_role_id" })
  departmentRoleId!: number;

  @ManyToOne(() => UserEntity, (user) => user.userRoles, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @ManyToOne(() => DepartmentRoleEntity, (departmentRole) => departmentRole.userRoles, {
    onDelete: "CASCADE",
    eager: true  // Carica automaticamente department e role
  })
  @JoinColumn({ name: "department_role_id" })
  departmentRole!: DepartmentRoleEntity;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}