import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserOrmEntity } from './user.orm-entity';

@Entity('projects')
export class ProjectOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'created_by' })
  creator: UserOrmEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
