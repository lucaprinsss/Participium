import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { userEntity } from "./userEntity";
import { reportEntity } from "./reportEntity";

@Entity("notifications")
export class notificationEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @ManyToOne(() => userEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: userEntity;

  @Column({ nullable: true })
  reportId?: number;

  @ManyToOne(() => reportEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "report_id" })
  report?: reportEntity;

  @Column({ type: "text" })
  content!: string;

  @Column({ default: false })
  isRead!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
