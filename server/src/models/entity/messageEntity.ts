import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ReportEntity } from "./reportEntity";
import { UserEntity } from "./userEntity";

@Entity("messages")
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reportId!: number;

  @ManyToOne(() => ReportEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: ReportEntity;

  @Column()
  senderId!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "sender_id" })
  sender!: UserEntity;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
