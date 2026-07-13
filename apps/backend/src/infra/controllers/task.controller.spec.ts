import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { CreateTaskUseCase } from '../../usecase/create-task.usecase';
import { UpdateTaskUseCase } from '../../usecase/update-task.usecase';
import { GetTaskUseCase } from '../../usecase/get-task.usecase';
import { ListTasksUseCase } from '../../usecase/list-tasks.usecase';
import { Task, TaskPriority, TaskProgressState } from '../../domain/entities/task.entity';

describe('TaskController', () => {
  let controller: TaskController;
  let mockTask: Task;

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
});
