import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

/**
 * Role entity - represents a user role/permission level
 */
@Entity("roles")
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @OneToMany("DepartmentRoleEntity", "role")
  departmentRoles!: any[];
}
