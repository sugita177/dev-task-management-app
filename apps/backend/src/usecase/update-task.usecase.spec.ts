import { UpdateTaskUseCase, UpdateTaskDto } from './update-task.usecase';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { Task, TaskProgressState, TaskPriority } from '../domain/entities/task.entity';

describe('UpdateTaskUseCase', () => {
  let useCase: UpdateTaskUseCase;
  let mockRepository: jest.Mocked<ITaskRepository>;
  let existingTask: Task;

  beforeEach(() => {
    existingTask = Task.create({
      id: 'task-123',
      title: 'Original Title',
      projectId: 'proj-1',
      progressState: TaskProgressState.BACKLOG,
      categoryId: 'cat-1',
      priority: TaskPriority.MEDIUM,
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(existingTask),
      findAll: jest.fn(),
    };
    useCase = new UpdateTaskUseCase(mockRepository);
  });

  it('タスクのステータスと計画日を更新し、リポジトリに保存できること', async () => {
    const dto: UpdateTaskDto = {
      id: 'task-123',
      progressState: TaskProgressState.IN_PROGRESS,
      plannedStartDate: new Date('2026-08-01'),
      plannedEndDate: new Date('2026-08-05'),
    };

    const task = await useCase.execute(dto);

    expect(task.progressState).toBe(TaskProgressState.IN_PROGRESS);
    expect(task.actualStartDate).toBeInstanceOf(Date);
    expect(task.plannedStartDate).toEqual(dto.plannedStartDate);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('タスクのタイトルや優先度など基本情報を更新し、リポジトリに保存できること', async () => {
    const dto: UpdateTaskDto = {
      id: 'task-123',
      title: 'Updated Title',
      priority: TaskPriority.HIGH,
      estimatedHours: 8,
    };

    const task = await useCase.execute(dto);

    expect(task.title).toBe('Updated Title');
    expect(task.priority).toBe(TaskPriority.HIGH);
    expect(task.estimatedHours).toBe(8);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('存在しないタスクIDを指定した場合はエラーになること', async () => {
    mockRepository.findById.mockResolvedValue(null);
    const dto: UpdateTaskDto = { id: 'invalid-id' };

    await expect(useCase.execute(dto)).rejects.toThrow('Task with ID invalid-id not found');
  });
});
