import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('tasks')
export class TaskOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @ManyToOne(() => ProjectOrmEntity)
  @JoinColumn({ name: 'project_id' })
  project: ProjectOrmEntity;

  @Column({ name: 'ticket_id', type: 'uuid', nullable: true })
  ticketId?: string;

  @Column({ name: 'assigned_user_id', type: 'uuid', nullable: true })
  assignedUserId?: string;

  @ManyToOne(() => UserOrmEntity, { nullable: true })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser?: UserOrmEntity;

  @Column({ name: 'progress_state_id', type: 'uuid' })
  progressStateId: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ name: 'priority_id', type: 'uuid' })
  priorityId: string;

  @Column({ name: 'planned_start_date', type: 'date', nullable: true })
  plannedStartDate?: Date;

  @Column({ name: 'planned_end_date', type: 'date', nullable: true })
  plannedEndDate?: Date;

  @Column({ name: 'actual_start_date', type: 'date', nullable: true })
  actualStartDate?: Date;

  @Column({ name: 'actual_end_date', type: 'date', nullable: true })
  actualEndDate?: Date;

  // DECIMAL型はTypeScriptではstringで返ってくることがあるため、transformerを使うかnumberキャストする
  @Column({
    name: 'estimated_hours',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number) => value,
      from: (value?: string) => value ? parseFloat(value) : undefined,
    }
  })
  estimatedHours?: number;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserOrmEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;
}

