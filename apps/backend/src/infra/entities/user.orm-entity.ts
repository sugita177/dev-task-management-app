import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RoleOrmEntity } from './role.orm-entity';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column()
  name: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleOrmEntity)
  @JoinColumn({ name: 'role_id' })
  role: RoleOrmEntity;
}
