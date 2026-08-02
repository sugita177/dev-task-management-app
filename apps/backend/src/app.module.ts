import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskOrmEntity } from './infra/entities/task.orm-entity';
import { RoleOrmEntity } from './infra/entities/role.orm-entity';
import { UserOrmEntity } from './infra/entities/user.orm-entity';
import { ProjectOrmEntity } from './infra/entities/project.orm-entity';
import { CommentOrmEntity } from './infra/entities/comment.orm-entity';
import { WorkLogOrmEntity } from './infra/entities/work-log.orm-entity';
import { TaskHistoryOrmEntity } from './infra/entities/task-history.orm-entity';
import { OrganizationOrmEntity } from './infra/entities/organization.orm-entity';
import { CategoryOrmEntity } from './infra/entities/category.orm-entity';
import { SeedService } from './infra/seed/seed.service';
import { UserController } from './infra/controllers/user.controller';
import { ProjectController } from './infra/controllers/project.controller';
import { OrganizationController } from './infra/controllers/organization.controller';
import { CategoryController } from './infra/controllers/category.controller';
import { TasksModule } from './tasks.module';
import { AuthModule } from './auth/auth.module';
import { TaskDependencyOrmEntity } from './infra/entities/task-dependency.orm-entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5432/dev_task_db',
      ssl: false,
      entities: [
        TaskOrmEntity,
        RoleOrmEntity,
        UserOrmEntity,
        ProjectOrmEntity,
        CommentOrmEntity,
        WorkLogOrmEntity,
        TaskHistoryOrmEntity,
        OrganizationOrmEntity,
        CategoryOrmEntity,
        TaskDependencyOrmEntity,
      ],
      synchronize: true,
    }),
    TasksModule,
    AuthModule,
  ],
  controllers: [
    AppController,
    UserController,
    ProjectController,
    OrganizationController,
    CategoryController,
  ],
  providers: [AppService, SeedService],
})
export class AppModule {}
