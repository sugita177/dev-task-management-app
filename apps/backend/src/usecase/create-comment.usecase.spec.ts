import { CreateCommentUseCase, CreateCommentDto } from './create-comment.usecase';
import { ICommentRepository } from '../domain/repositories/comment-repository.interface';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { Task, TaskProgressState, TaskPriority } from '../domain/entities/task.entity';

describe('CreateCommentUseCase', () => {
  let useCase: CreateCommentUseCase;
  let mockCommentRepository: jest.Mocked<ICommentRepository>;
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

    mockCommentRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findByTaskId: jest.fn(),
    };

    mockTaskRepository = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(task),
      findAll: jest.fn(),
    };

    useCase = new CreateCommentUseCase(mockCommentRepository, mockTaskRepository);
  });

  it('コメントを正常に作成し、保存できること', async () => {
    const dto: CreateCommentDto = {
      taskId: 'task-123',
      userId: 'user-1',
      content: '新しいコメント',
    };

    const comment = await useCase.execute(dto);

    expect(comment.taskId).toBe('task-123');
    expect(comment.content).toBe('新しいコメント');
    expect(mockCommentRepository.save).toHaveBeenCalledTimes(1);
  });

  it('存在しないタスクにコメントしようとした場合はエラーになること', async () => {
    mockTaskRepository.findById.mockResolvedValue(null);
    const dto: CreateCommentDto = {
      taskId: 'invalid-id',
      userId: 'user-1',
      content: 'コメント',
    };

    await expect(useCase.execute(dto)).rejects.toThrow('Task with ID invalid-id not found');
  });
});
