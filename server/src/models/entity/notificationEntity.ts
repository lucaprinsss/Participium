import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { UserEntity } from "./userEntity";
import { ReportEntity } from "./reportEntity";

@Entity("notifications")
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @Column({ nullable: true })
  reportId?: number;

  @ManyToOne(() => ReportEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "report_id" })
  report?: ReportEntity;

  @Column({ type: "text" })
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
