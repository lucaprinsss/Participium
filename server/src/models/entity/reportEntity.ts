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
import { userEntity } from "./userEntity";
import { photoEntity } from "./photoEntity";

@Entity("reports")
export class reportEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  reporterId!: number;

  @ManyToOne(() => userEntity)
  @JoinColumn({ name: "reporter_id" })
  reporter!: userEntity;

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

  @ManyToOne(() => userEntity, { nullable: true })
  @JoinColumn({ name: "assignee_id" })
  assignee?: userEntity;

  @Column({ nullable: true })
  externalAssigneeId?: number;

  @ManyToOne(() => userEntity, { nullable: true })
  @JoinColumn({ name: "external_assignee_id" })
  externalAssignee?: userEntity;

  @OneToMany(() => photoEntity, (photo) => photo.report, {
    cascade: true,
    eager: true 
  })
  photos!: photoEntity[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
