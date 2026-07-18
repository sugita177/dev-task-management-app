import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './infra/controllers/task.controller';
import { TaskRepository } from './infra/repositories/task.repository';
import { CommentRepository } from './infra/repositories/comment.repository';
import { WorkLogRepository } from './infra/repositories/work-log.repository';
import { TaskHistoryRepository } from './infra/repositories/task-history.repository';
import { TaskOrmEntity } from './infra/entities/task.orm-entity';
import { CommentOrmEntity } from './infra/entities/comment.orm-entity';
import { WorkLogOrmEntity } from './infra/entities/work-log.orm-entity';
import { TaskHistoryOrmEntity } from './infra/entities/task-history.orm-entity';
import { CreateTaskUseCase } from './usecase/create-task.usecase';
import { UpdateTaskUseCase } from './usecase/update-task.usecase';
import { GetTaskUseCase } from './usecase/get-task.usecase';
import { ListTasksUseCase } from './usecase/list-tasks.usecase';
import { CreateCommentUseCase } from './usecase/create-comment.usecase';
import { ListCommentsUseCase } from './usecase/list-comments.usecase';
import { CreateWorkLogUseCase } from './usecase/create-work-log.usecase';
import { ListWorkLogsUseCase } from './usecase/list-work-logs.usecase';
import { ListTaskHistoriesUseCase } from './usecase/list-task-histories.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TaskOrmEntity,
      CommentOrmEntity,
      WorkLogOrmEntity,
      TaskHistoryOrmEntity,
    ]),
  ],
  controllers: [TaskController],
  providers: [
    {
      provide: 'ITaskRepository',
      useClass: TaskRepository,
    },
    {
      provide: 'ICommentRepository',
      useClass: CommentRepository,
    },
    {
      provide: 'IWorkLogRepository',
      useClass: WorkLogRepository,
    },
    {
      provide: 'ITaskHistoryRepository',
      useClass: TaskHistoryRepository,
    },
    {
      provide: CreateTaskUseCase,
      useFactory: (repo) => new CreateTaskUseCase(repo),
      inject: ['ITaskRepository'],
    },
    {
      provide: UpdateTaskUseCase,
      useFactory: (repo, historyRepo) => new UpdateTaskUseCase(repo, historyRepo),
      inject: ['ITaskRepository', 'ITaskHistoryRepository'],
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
    {
      provide: CreateCommentUseCase,
      useFactory: (commentRepo, taskRepo) => new CreateCommentUseCase(commentRepo, taskRepo),
      inject: ['ICommentRepository', 'ITaskRepository'],
    },
    {
      provide: ListCommentsUseCase,
      useFactory: (commentRepo) => new ListCommentsUseCase(commentRepo),
      inject: ['ICommentRepository'],
    },
    {
      provide: CreateWorkLogUseCase,
      useFactory: (workLogRepo, taskRepo) => new CreateWorkLogUseCase(workLogRepo, taskRepo),
      inject: ['IWorkLogRepository', 'ITaskRepository'],
    },
    {
      provide: ListWorkLogsUseCase,
      useFactory: (workLogRepo) => new ListWorkLogsUseCase(workLogRepo),
      inject: ['IWorkLogRepository'],
    },
    {
      provide: ListTaskHistoriesUseCase,
      useFactory: (historyRepo) => new ListTaskHistoriesUseCase(historyRepo),
      inject: ['ITaskHistoryRepository'],
    },
  ],
})
export class TasksModule {}
