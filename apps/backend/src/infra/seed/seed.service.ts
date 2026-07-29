import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RoleOrmEntity } from '../entities/role.orm-entity';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { ProjectOrmEntity } from '../entities/project.orm-entity';
import { OrganizationOrmEntity } from '../entities/organization.orm-entity';
import { CategoryOrmEntity } from '../entities/category.orm-entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly entityManager: EntityManager) {}

  async onApplicationBootstrap() {
    this.logger.log('Starting DB Seeding...');
    await this.seedCategories();
    await this.seedOrganizations();
    await this.seedRoles();
    await this.seedUsers();
    await this.seedProjects();
    this.logger.log('DB Seeding Completed.');
  }

  private async seedCategories() {
    const categories = [
      { id: '00000000-0000-0000-0000-000000000701', name: '機能開発', code: 'FEATURE' },
      { id: '00000000-0000-0000-0000-000000000702', name: 'バグ修正', code: 'BUG_FIX' },
      { id: '00000000-0000-0000-0000-000000000703', name: 'インフラ・CI/CD', code: 'INFRA' },
      { id: '00000000-0000-0000-0000-000000000704', name: 'ドキュメント・調査', code: 'DOCS' },
      { id: '00000000-0000-0000-0000-000000000705', name: 'リファクタリング', code: 'REFACTOR' },
    ];

    for (const cat of categories) {
      const exists = await this.entityManager.findOneBy(CategoryOrmEntity, { id: cat.id });
      if (!exists) {
        this.logger.log(`Seeding category: ${cat.name}`);
        const entity = this.entityManager.create(CategoryOrmEntity, cat);
        await this.entityManager.save(CategoryOrmEntity, entity);
      }
    }
  }

  private async seedOrganizations() {
    const orgs = [
      {
        id: '00000000-0000-0000-0000-000000000601',
        name: '開発第一チーム',
        code: 'DEV_DIV_1',
      },
      {
        id: '00000000-0000-0000-0000-000000000602',
        name: 'SREチーム',
        code: 'SRE_TEAM',
      },
    ];

    for (const org of orgs) {
      const exists = await this.entityManager.findOneBy(OrganizationOrmEntity, { id: org.id });
      if (!exists) {
        this.logger.log(`Seeding organization: ${org.name}`);
        const entity = this.entityManager.create(OrganizationOrmEntity, org);
        await this.entityManager.save(OrganizationOrmEntity, entity);
      }
    }
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
    const defaultOrgId = '00000000-0000-0000-0000-000000000601'; // 開発第一チーム

    const users = [
      {
        id: '00000000-0000-0000-0000-000000000401',
        email: 'satoshi@example.com',
        passwordHash,
        name: 'Satoshi Manager',
        roleId: '00000000-0000-0000-0000-000000000504', // ENGINEERING_MANAGER
        organizationId: defaultOrgId,
      },
      {
        id: '00000000-0000-0000-0000-000000000402',
        email: 'tanaka@example.com',
        passwordHash,
        name: '田中 太郎',
        roleId: '00000000-0000-0000-0000-000000000502', // ENGINEER
        organizationId: defaultOrgId,
      },
      {
        id: '00000000-0000-0000-0000-000000000403',
        email: 'suzuki@example.com',
        passwordHash,
        name: '鈴木 一郎',
        roleId: '00000000-0000-0000-0000-000000000502', // ENGINEER
        organizationId: defaultOrgId,
      },
    ];

    for (const user of users) {
      const existingUser = await this.entityManager.findOneBy(UserOrmEntity, { id: user.id });
      if (!existingUser) {
        this.logger.log(`Seeding user: ${user.name}`);
        const entity = this.entityManager.create(UserOrmEntity, user);
        await this.entityManager.save(UserOrmEntity, entity);
      } else {
        let updated = false;
        if (!existingUser.passwordHash || !existingUser.passwordHash.startsWith('$2')) {
          this.logger.log(`Updating password hash for user: ${user.name}`);
          existingUser.passwordHash = passwordHash;
          updated = true;
        }
        if (!existingUser.organizationId) {
          this.logger.log(`Linking organization for user: ${user.name}`);
          existingUser.organizationId = defaultOrgId;
          updated = true;
        }
        if (updated) {
          await this.entityManager.save(UserOrmEntity, existingUser);
        }
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
