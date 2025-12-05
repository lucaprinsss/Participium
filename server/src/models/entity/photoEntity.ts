import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { ReportEntity } from "./reportEntity";

@Entity("photos")
export class PhotoEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reportId!: number;

  @ManyToOne(() => ReportEntity, (report) => report.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "report_id" })
  report!: ReportEntity;

  @Column({ type: "text" })
  storageUrl!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
