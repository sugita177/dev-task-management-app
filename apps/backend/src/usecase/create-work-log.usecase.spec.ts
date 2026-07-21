import { CreateWorkLogUseCase, CreateWorkLogDto } from './create-work-log.usecase';
import { IWorkLogRepository } from '../domain/repositories/work-log-repository.interface';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { Task, TaskProgressState, TaskPriority } from '../domain/entities/task.entity';

describe('CreateWorkLogUseCase', () => {
  let useCase: CreateWorkLogUseCase;
  let mockWorkLogRepository: jest.Mocked<IWorkLogRepository>;
  let mockTaskRepository: jest.Mocked<ITaskRepository>;
  let task: Task;

  beforeEach(() => {
    task = Task.create({
      id: 'task-123',
      title: 'Test Task',
      projectId: 'proj-1',
      progressState: TaskProgressState.BACKLOG,
      categoryId: 'cat-1',
      priority: TaskPriority.MEDIUM,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockWorkLogRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findByTaskId: jest.fn(),
    };

    mockTaskRepository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(task),
      findAll: jest.fn(),
    };

    useCase = new CreateWorkLogUseCase(mockWorkLogRepository, mockTaskRepository);
  });

  it('実績工数を正常に記録し、保存できること', async () => {
    const dto: CreateWorkLogDto = {
      taskId: 'task-123',
      userId: 'user-1',
      loggedDate: new Date('2026-07-18'),
      hours: 3.5,
      description: 'デバッグ作業',
    };

    const log = await useCase.execute(dto);

    expect(log.taskId).toBe('task-123');
    expect(log.hours).toBe(3.5);
    expect(log.description).toBe('デバッグ作業');
    expect(mockWorkLogRepository.save).toHaveBeenCalledTimes(1);
  });

  it('存在しないタスクに工数記録しようとした場合はエラーになること', async () => {
    mockTaskRepository.findById.mockResolvedValue(null);
    const dto: CreateWorkLogDto = {
      taskId: 'invalid-id',
      userId: 'user-1',
      loggedDate: new Date(),
      hours: 1.5,
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Task with ID invalid-id not found');
  });
});
