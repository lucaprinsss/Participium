import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { reportEntity } from "./reportEntity";

@Entity("photos")
export class photoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reportId!: number;

  @ManyToOne(() => reportEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: reportEntity;

  @Column({ type: "text" })
  storageUrl!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
