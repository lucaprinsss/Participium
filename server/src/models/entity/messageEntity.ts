import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { reportEntity } from "./reportEntity";
import { userEntity } from "./userEntity";

@Entity("messages")
export class messageEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reportId!: number;

  @ManyToOne(() => reportEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: reportEntity;

  @Column()
  senderId!: number;

  @ManyToOne(() => userEntity)
  @JoinColumn({ name: "sender_id" })
  sender!: userEntity;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
