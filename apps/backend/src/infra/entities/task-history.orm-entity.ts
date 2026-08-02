import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TaskOrmEntity } from './task.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('task_histories')
export class TaskHistoryOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @ManyToOne(() => TaskOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: TaskOrmEntity;

  @Column({ name: 'changed_by', type: 'uuid' })
  changedBy: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'changed_by' })
  changedByUser: UserOrmEntity;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ name: 'before_payload', type: 'jsonb', nullable: true })
  beforePayload?: Record<string, unknown>;

  @Column({ name: 'after_payload', type: 'jsonb', nullable: true })
  afterPayload?: Record<string, unknown>;

  @Column({ name: 'comment', nullable: true })
  comment?: string;

  @CreateDateColumn({ name: 'changed_at' })
  changedAt: Date;
}
