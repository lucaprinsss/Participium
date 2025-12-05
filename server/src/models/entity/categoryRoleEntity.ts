import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ReportCategory } from '../dto/ReportCategory';
import { RoleEntity } from './roleEntity';

@Entity('category_role_mapping')
export class CategoryRoleEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: ReportCategory,
    unique: true
  })
  category!: ReportCategory;

  @Column({ name: 'role_id' })
  roleId!: number;

  @ManyToOne(() => RoleEntity)
  @JoinColumn({ name: 'role_id' })
  role!: RoleEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}