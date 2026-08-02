import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TaskOrmEntity } from './task.orm-entity';

@Entity('task_dependencies')
export class TaskDependencyOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'dependent_task_id', type: 'uuid' })
  dependentTaskId: string;

  @ManyToOne(() => TaskOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dependent_task_id' })
  dependentTask: TaskOrmEntity;

  @Column({ name: 'depends_on_task_id', type: 'uuid' })
  dependsOnTaskId: string;

  @ManyToOne(() => TaskOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'depends_on_task_id' })
  dependsOnTask: TaskOrmEntity;

  @Column({ name: 'type', default: 'FINISH_TO_START' })
  type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
