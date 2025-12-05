import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  OneToMany 
} from "typeorm";
import { UserEntity } from "./userEntity";
import { PhotoEntity } from "./photoEntity";

@Entity("reports")
export class ReportEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reporterId!: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: "reporter_id" })
  reporter!: UserEntity;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ 
    type: "enum", 
    enum: [
      "Water Supply - Drinking Water",
      "Architectural Barriers",
      "Sewer System",
      "Public Lighting",
      "Waste",
      "Road Signs and Traffic Lights",
      "Roads and Urban Furnishings",
      "Public Green Areas and Playgrounds",
      "Other"
    ]
  })
  category!: string;

  @Column({ type: "geography", spatialFeatureType: "Point", srid: 4326 })
  location!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  address?: string;

  @Column({ default: false })
  isAnonymous!: boolean;

  @Column({ 
    type: "enum", 
    enum: [
      "Pending Approval",
      "Assigned", 
      "In Progress", 
      "Suspended", 
      "Rejected", 
      "Resolved"
    ],
    default: "Pending Approval"
  })
  status!: string;

  @Column({ type: "text", nullable: true })
  rejectionReason?: string;

  @Column({ nullable: true })
  assigneeId?: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "assignee_id" })
  assignee?: UserEntity;

  @Column({ nullable: true })
  externalAssigneeId?: number;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "external_assignee_id" })
  externalAssignee?: UserEntity;

  @OneToMany(() => PhotoEntity, (photo) => photo.report, {
    cascade: true,
    eager: true 
  })
  photos!: PhotoEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
