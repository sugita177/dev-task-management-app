import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
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
  user: UserOrmEntity;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ name: 'before_payload', type: 'jsonb', nullable: true })
  beforePayload?: any;

  @Column({ name: 'after_payload', type: 'jsonb', nullable: true })
  afterPayload?: any;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ name: 'changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  changedAt: Date;
}
