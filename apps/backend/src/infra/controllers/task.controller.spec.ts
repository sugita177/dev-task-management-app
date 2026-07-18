import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { CreateTaskUseCase } from '../../usecase/create-task.usecase';
import { UpdateTaskUseCase } from '../../usecase/update-task.usecase';
import { GetTaskUseCase } from '../../usecase/get-task.usecase';
import { ListTasksUseCase } from '../../usecase/list-tasks.usecase';
import { CreateCommentUseCase } from '../../usecase/create-comment.usecase';
import { ListCommentsUseCase } from '../../usecase/list-comments.usecase';
import { CreateWorkLogUseCase } from '../../usecase/create-work-log.usecase';
import { ListWorkLogsUseCase } from '../../usecase/list-work-logs.usecase';
import { ListTaskHistoriesUseCase } from '../../usecase/list-task-histories.usecase';
import { Task, TaskPriority, TaskProgressState } from '../../domain/entities/task.entity';
import { Comment } from '../../domain/entities/comment.entity';
import { WorkLog } from '../../domain/entities/work-log.entity';
import { TaskHistory } from '../../domain/entities/task-history.entity';

describe('TaskController', () => {
  let controller: TaskController;
  let mockTask: Task;
  let mockComment: Comment;
  let mockWorkLog: WorkLog;
  let mockHistory: TaskHistory;

  beforeEach(async () => {
    mockTask = Task.create({
      id: 'task-123',
      title: 'Controller Test Task',
      projectId: 'proj-1',
      progressState: TaskProgressState.BACKLOG,
      categoryId: 'cat-1',
      priority: TaskPriority.MEDIUM,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockComment = Comment.create({
      id: 'comment-123',
      taskId: 'task-123',
      userId: 'user-1',
      content: 'テストコメント',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockWorkLog = WorkLog.create({
      id: 'wl-123',
      taskId: 'task-123',
      userId: 'user-1',
      loggedDate: new Date('2026-07-18'),
      hours: 2.5,
      description: '作業ログ',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockHistory = TaskHistory.create({
      id: 'history-123',
      taskId: 'task-123',
      changedBy: 'user-1',
      actionType: 'UPDATE',
      beforePayload: {},
      afterPayload: {},
      changedAt: new Date(),
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: CreateTaskUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockTask) },
        },
        {
          provide: UpdateTaskUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockTask) },
        },
        {
          provide: GetTaskUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockTask) },
        },
        {
          provide: ListTasksUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([mockTask]) },
        },
        {
          provide: CreateCommentUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockComment) },
        },
        {
          provide: ListCommentsUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([mockComment]) },
        },
        {
          provide: CreateWorkLogUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(mockWorkLog) },
        },
        {
          provide: ListWorkLogsUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([mockWorkLog]) },
        },
        {
          provide: ListTaskHistoriesUseCase,
          useValue: { execute: jest.fn().mockResolvedValue([mockHistory]) },
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
  });

  it('POST /tasks が正常に動作し、ドメインモデルからマッピングされたデータが返ること', async () => {
    const response = await controller.create({
      title: 'Controller Test Task',
      projectId: 'proj-1',
      categoryId: 'cat-1',
      priority: TaskPriority.MEDIUM,
      createdBy: 'user-1',
    });

    expect(response.id).toBe('task-123');
    expect(response.title).toBe('Controller Test Task');
    expect(response.progressState).toBe(TaskProgressState.BACKLOG);
  });

  it('GET /tasks/:id が正常に動作し、タスク詳細が返ること', async () => {
    const response = await controller.get('task-123');
    expect(response.id).toBe('task-123');
    expect(response.title).toBe('Controller Test Task');
  });

  it('GET /tasks が正常に動作し、タスク一覧が返ること', async () => {
    const response = await controller.list();
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1);
    expect(response[0].id).toBe('task-123');
  });

  it('POST /tasks/:id/comments が正常に動作し、コメントデータが返ること', async () => {
    const response = await controller.createComment('task-123', {
      userId: 'user-1',
      content: 'テストコメント',
    });
    expect(response.id).toBe('comment-123');
    expect(response.content).toBe('テストコメント');
  });

  it('GET /tasks/:id/comments が正常に動作し、コメント一覧が返ること', async () => {
    const response = await controller.listComments('task-123');
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1);
    expect(response[0].content).toBe('テストコメント');
  });

  it('POST /tasks/:id/work-logs が正常に動作し、実績工数が返ること', async () => {
    const response = await controller.createWorkLog('task-123', {
      userId: 'user-1',
      loggedDate: '2026-07-18',
      hours: 2.5,
      description: '作業ログ',
    });
    expect(response.id).toBe('wl-123');
    expect(response.hours).toBe(2.5);
  });

  it('GET /tasks/:id/work-logs が正常に動作し、実績工数一覧が返ること', async () => {
    const response = await controller.listWorkLogs('task-123');
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1);
    expect(response[0].hours).toBe(2.5);
  });

  it('GET /tasks/:id/histories が正常に動作し、タスク変更履歴が返ること', async () => {
    const response = await controller.listHistories('task-123');
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1);
    expect(response[0].id).toBe('history-123');
  });
});
