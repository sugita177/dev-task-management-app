import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleOrmEntity } from '../entities/role.orm-entity';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { ProjectOrmEntity } from '../entities/project.orm-entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly entityManager: EntityManager) {}

  async onApplicationBootstrap() {
    this.logger.log('Starting DB Seeding...');
    await this.seedRoles();
    await this.seedUsers();
    await this.seedProjects();
    this.logger.log('DB Seeding Completed.');
  }

  private async seedRoles() {
    const roles = [
      { id: '00000000-0000-0000-0000-000000000501', name: 'ADMINISTRATOR' },
      { id: '00000000-0000-0000-0000-000000000502', name: 'ENGINEER' },
      { id: '00000000-0000-0000-0000-000000000503', name: 'BUSINESS' },
      { id: '00000000-0000-0000-0000-000000000504', name: 'ENGINEERING_MANAGER' },
    ];

    for (const role of roles) {
      const exists = await this.entityManager.findOneBy(RoleOrmEntity, { id: role.id });
      if (!exists) {
        this.logger.log(`Seeding role: ${role.name}`);
        const entity = this.entityManager.create(RoleOrmEntity, role);
        await this.entityManager.save(RoleOrmEntity, entity);
      }
    }
  }

  private async seedUsers() {
    const passwordHash = await bcrypt.hash('password123', 10);

    const users = [
      {
        id: '00000000-0000-0000-0000-000000000401',
        email: 'satoshi@example.com',
        passwordHash,
        name: 'Satoshi Manager',
        roleId: '00000000-0000-0000-0000-000000000504', // ENGINEERING_MANAGER
      },
      {
        id: '00000000-0000-0000-0000-000000000402',
        email: 'tanaka@example.com',
        passwordHash,
        name: '田中 太郎',
        roleId: '00000000-0000-0000-0000-000000000502', // ENGINEER
      },
      {
        id: '00000000-0000-0000-0000-000000000403',
        email: 'suzuki@example.com',
        passwordHash,
        name: '鈴木 一郎',
        roleId: '00000000-0000-0000-0000-000000000502', // ENGINEER
      },
    ];

    for (const user of users) {
      const existingUser = await this.entityManager.findOneBy(UserOrmEntity, { id: user.id });
      if (!existingUser) {
        this.logger.log(`Seeding user: ${user.name}`);
        const entity = this.entityManager.create(UserOrmEntity, user);
        await this.entityManager.save(UserOrmEntity, entity);
      } else if (!existingUser.passwordHash || !existingUser.passwordHash.startsWith('$2')) {
        this.logger.log(`Updating password hash for user: ${user.name}`);
        existingUser.passwordHash = passwordHash;
        await this.entityManager.save(UserOrmEntity, existingUser);
      }
    }
  }

  private async seedProjects() {
    const projects = [
      {
        id: '00000000-0000-0000-0000-000000000201',
        name: '認証基盤システム',
        isArchived: false,
        createdBy: '00000000-0000-0000-0000-000000000401', // Satoshi Manager
      },
      {
        id: '00000000-0000-0000-0000-000000000202',
        name: 'DevTaskApp',
        isArchived: false,
        createdBy: '00000000-0000-0000-0000-000000000401',
      },
      {
        id: '00000000-0000-0000-0000-000000000203',
        name: '共通APIサービス',
        isArchived: false,
        createdBy: '00000000-0000-0000-0000-000000000401',
      },
    ];

    for (const project of projects) {
      const exists = await this.entityManager.findOneBy(ProjectOrmEntity, { id: project.id });
      if (!exists) {
        this.logger.log(`Seeding project: ${project.name}`);
        const entity = this.entityManager.create(ProjectOrmEntity, project);
        await this.entityManager.save(ProjectOrmEntity, entity);
      }
    }
  }
}
