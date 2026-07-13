import { CreateTaskUseCase, CreateTaskDto } from './create-task.usecase';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { TaskProgressState, TaskPriority } from '../domain/entities/task.entity';

describe('CreateTaskUseCase', () => {
  let useCase: CreateTaskUseCase;
  let mockRepository: jest.Mocked<ITaskRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findAll: jest.fn(),
    };
    useCase = new CreateTaskUseCase(mockRepository);
  });

  it('正常な入力でタスクを作成し、リポジトリに保存されること', async () => {
    const dto: CreateTaskDto = {
      title: 'New Feature Task',
      description: 'Implement new login screen',
      projectId: 'project-uuid-1',
      categoryId: 'category-uuid-1',
      priority: TaskPriority.HIGH,
      createdBy: 'user-uuid-99',
      estimatedHours: 5,
    };

    const task = await useCase.execute(dto);

    expect(task.title).toBe(dto.title);
    expect(task.progressState).toBe(TaskProgressState.BACKLOG);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalledWith(task);
  });
});
