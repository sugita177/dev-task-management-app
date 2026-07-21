import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TaskOrmEntity } from './task.orm-entity';
import { UserOrmEntity } from './user.orm-entity';

@Entity('work_logs')
export class WorkLogOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'task_id', type: 'uuid' })
  taskId: string;

  @ManyToOne(() => TaskOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: TaskOrmEntity;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserOrmEntity;

  @Column({ name: 'logged_date', type: 'date' })
  loggedDate: Date;

  @Column({
    name: 'hours',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value?: number) => value,
      from: (value?: string) => value ? parseFloat(value) : undefined,
    }
  })
  hours: number;

  @Column({ name: 'description', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
