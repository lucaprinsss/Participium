import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Unique } from "typeorm";
import { DepartmentEntity } from "./departmentEntity";
import { RoleEntity } from "./roleEntity";
import { UserEntity } from "./userEntity";
import { UserRoleEntity } from "./userRoleEntity";

/**
 * DepartmentRole entity - represents the join table between departments and roles
 * Defines valid "positions" by linking departments to roles
 */
@Entity("department_roles")
@Unique(["departmentId", "roleId"])
export class DepartmentRoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "department_id" })
  departmentId!: number;

  @Column({ name: "role_id" })
  roleId!: number;

  @ManyToOne(() => DepartmentEntity, (department) => department.departmentRoles, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "department_id" })
  department!: DepartmentEntity;

  @ManyToOne(() => RoleEntity, (role) => role.departmentRoles, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "role_id" })
  role!: RoleEntity;

  @OneToMany(() => UserRoleEntity, (userRole) => userRole.departmentRole)
  userRoles!: UserRoleEntity[];
}
