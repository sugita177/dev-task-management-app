import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('roles')
export class RoleOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;
}
