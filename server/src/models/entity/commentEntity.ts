import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ReportEntity } from "./reportEntity";
import { UserEntity } from "./userEntity";

@Entity("comments")
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reportId!: number;

  @ManyToOne(() => ReportEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: ReportEntity;

  @Column()
  authorId!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "author_id" })
  author!: UserEntity;

  @Column({ type: "text" })
  content!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
