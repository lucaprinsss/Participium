import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { reportEntity } from "./reportEntity";
import { userEntity } from "./userEntity";

@Entity("comments")
export class commentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reportId!: number;

  @ManyToOne(() => reportEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: reportEntity;

  @Column()
  authorId!: number;

  @ManyToOne(() => userEntity)
  @JoinColumn({ name: "author_id" })
  author!: userEntity;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
