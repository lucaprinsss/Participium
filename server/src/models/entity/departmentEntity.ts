import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

/**
 * Department entity - represents a municipal department
 */
@Entity("departments")
export class DepartmentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100, unique: true })
  name!: string;

  @OneToMany("DepartmentRoleEntity", "department")
  departmentRoles!: any[];
}
