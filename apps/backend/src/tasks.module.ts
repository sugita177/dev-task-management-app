import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './infra/controllers/task.controller';
import { TaskRepository } from './infra/repositories/task.repository';
import { TaskOrmEntity } from './infra/entities/task.orm-entity';
import { CreateTaskUseCase } from './usecase/create-task.usecase';
import { UpdateTaskUseCase } from './usecase/update-task.usecase';
import { GetTaskUseCase } from './usecase/get-task.usecase';
import { ListTasksUseCase } from './usecase/list-tasks.usecase';

@Module({
  imports: [TypeOrmModule.forFeature([TaskOrmEntity])],
  controllers: [TaskController],
  providers: [
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },
    {
      provide: CreateTaskUseCase,
      useFactory: (repo) => new CreateTaskUseCase(repo),
      inject: ['ITaskRepository'],
    },
    {
      provide: UpdateTaskUseCase,
      useFactory: (repo) => new UpdateTaskUseCase(repo),
      inject: ['ITaskRepository'],
    },
    {
      provide: GetTaskUseCase,
      useFactory: (repo) => new GetTaskUseCase(repo),
      inject: ['ITaskRepository'],
    },
    {
      provide: ListTasksUseCase,
      useFactory: (repo) => new ListTasksUseCase(repo),
      inject: ['ITaskRepository'],
    },
  ],
})
export class TasksModule {}
