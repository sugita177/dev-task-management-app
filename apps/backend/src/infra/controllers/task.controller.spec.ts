import { TaskController } from './task.controller';
import { Repository } from 'typeorm';
import { TaskPriority } from '../../domain/entities/task.entity';

import { TaskDependencyOrmEntity } from '../entities/task-dependency.orm-entity';

describe('TaskController (Unit Test for JWT User Binding)', () => {
  let controller: TaskController;
  let mockCreateTaskUseCase: { execute: jest.Mock };
  let mockUpdateTaskUseCase: { execute: jest.Mock };
  let mockGetTaskUseCase: { execute: jest.Mock };
  let mockListTasksUseCase: { execute: jest.Mock };
  let mockCreateCommentUseCase: { execute: jest.Mock };
  let mockListCommentsUseCase: { execute: jest.Mock };
  let mockCreateWorkLogUseCase: { execute: jest.Mock };
  let mockListWorkLogsUseCase: { execute: jest.Mock };
  let mockListTaskHistoriesUseCase: { execute: jest.Mock };
  let mockDependencyRepo: Partial<Repository<TaskDependencyOrmEntity>>;
  let mockHistoryRepo: Partial<Repository<any>>;

  const mockUserReq = {
    user: {
      userId: 'user-uuid-1234',
      email: 'test@example.com',
      name: 'Test Engineer',
    },
  };

  beforeEach(() => {
    mockCreateTaskUseCase = { execute: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Test Task' }) };
    mockUpdateTaskUseCase = { execute: jest.fn().mockResolvedValue({ id: 'task-1', title: 'Updated Task' }) };
    mockGetTaskUseCase = { execute: jest.fn().mockResolvedValue({ id: 'task-1' }) };
    mockListTasksUseCase = { execute: jest.fn().mockResolvedValue([]) };
    mockCreateCommentUseCase = { execute: jest.fn().mockResolvedValue({ id: 'comment-1', content: 'Test' }) };
    mockListCommentsUseCase = { execute: jest.fn().mockResolvedValue([]) };
    mockCreateWorkLogUseCase = { execute: jest.fn().mockResolvedValue({ id: 'work-log-1', hours: 2 }) };
    mockListWorkLogsUseCase = { execute: jest.fn().mockResolvedValue([]) };
    mockListTaskHistoriesUseCase = { execute: jest.fn().mockResolvedValue([]) };
    mockDependencyRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockHistoryRepo = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    };

    const mockTaskRepo = {
      findOneBy: jest.fn().mockResolvedValue({ id: 'task-1', title: 'テストタスク' }),
    };

    controller = new TaskController(
      mockCreateTaskUseCase as any,
      mockUpdateTaskUseCase as any,
      mockGetTaskUseCase as any,
      mockListTasksUseCase as any,
      mockCreateCommentUseCase as any,
      mockListCommentsUseCase as any,
      mockCreateWorkLogUseCase as any,
      mockListWorkLogsUseCase as any,
      mockListTaskHistoriesUseCase as any,
      mockDependencyRepo as unknown as Repository<any>,
      mockHistoryRepo as unknown as Repository<any>,
      mockTaskRepo as unknown as Repository<any>,
    );
  });

  it('タスク作成時に req.user.userId が createdBy へ自動セットされること', async () => {
    const dto = {
      title: 'New Task',
      projectId: 'proj-1',
      categoryId: 'cat-1',
      priority: TaskPriority.HIGH,
    };

    await controller.create(mockUserReq, dto);

    expect(mockCreateTaskUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Task',
        createdBy: 'user-uuid-1234',
      }),
    );
  });

  it('タスク更新時に req.user.userId が changedBy へ自動セットされること', async () => {
    const dto = {
      title: 'Updated Task Title',
    };

    await controller.update(mockUserReq, 'task-1', dto);

    expect(mockUpdateTaskUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        title: 'Updated Task Title',
        changedBy: 'user-uuid-1234',
      }),
    );
  });

  it('コメント追加時に req.user.userId が userId へ自動セットされること', async () => {
    const dto = {
      content: 'LGTM!',
    };

    await controller.createComment(mockUserReq, 'task-1', dto);

    expect(mockCreateCommentUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        content: 'LGTM!',
        userId: 'user-uuid-1234',
      }),
    );
  });

  it('工数記録時に req.user.userId が userId へ自動セットされること', async () => {
    const dto = {
      loggedDate: '2026-07-27',
      hours: 4,
    };

    await controller.createWorkLog(mockUserReq, 'task-1', dto);

    expect(mockCreateWorkLogUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        hours: 4,
        userId: 'user-uuid-1234',
      }),
    );
  });

  describe('タスク依存関係 API (Dependencies)', () => {
    it('依存関係一覧を取得できること (listDependencies)', async () => {
      await controller.listDependencies();
      expect(mockDependencyRepo.find).toHaveBeenCalled();
    });

    it('依存関係を正常に登録できること (createDependency) および両タスクへの変更履歴追加の検証', async () => {
      const dto = { dependentTaskId: 'task-2', dependsOnTaskId: 'task-1' };
      const res = await controller.createDependency(mockUserReq, dto);

      expect(mockDependencyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dependentTaskId: 'task-2',
          dependsOnTaskId: 'task-1',
          type: 'FINISH_TO_START',
        }),
      );
      expect(mockDependencyRepo.save).toHaveBeenCalled();
      expect(res).toBeDefined();

      // 双方向（設定側・被設定側）の履歴追加の検証
      expect(mockHistoryRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            taskId: 'task-2',
            actionType: 'TASK_DEPENDENCY_CREATED',
            changedBy: 'user-uuid-1234',
            comment: expect.stringContaining('依存関係として追加されました'),
          }),
          expect.objectContaining({
            taskId: 'task-1',
            actionType: 'TASK_DEPENDENCY_CREATED',
            changedBy: 'user-uuid-1234',
            comment: expect.stringContaining('依存関係として追加されました'),
          }),
        ]),
      );
    });

    it('自分自身への依存登録で例外 BadRequestException がスローされること', async () => {
      const dto = { dependentTaskId: 'task-1', dependsOnTaskId: 'task-1' };
      await expect(controller.createDependency(mockUserReq, dto)).rejects.toThrow();
    });

    it('依存関係の変更・更新ができること (updateDependency)', async () => {
      (mockDependencyRepo.findOneBy as jest.Mock).mockResolvedValueOnce({
        id: 'dep-1',
        dependentTaskId: 'task-2',
        dependsOnTaskId: 'task-1',
        type: 'FINISH_TO_START',
      });

      const res = await controller.updateDependency(mockUserReq, 'dep-1', { dependsOnTaskId: 'task-3' });
      expect(mockDependencyRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'dep-1',
          dependsOnTaskId: 'task-3',
        }),
      );
    });

    it('依存関係を削除できること (deleteDependency) および両タスクへの解除履歴追加の検証', async () => {
      (mockDependencyRepo.findOneBy as jest.Mock).mockResolvedValueOnce({
        id: 'dep-1',
        dependentTaskId: 'task-2',
        dependsOnTaskId: 'task-1',
        type: 'FINISH_TO_START',
      });

      const res = await controller.deleteDependency(mockUserReq, 'dep-1');
      expect(mockDependencyRepo.delete).toHaveBeenCalledWith('dep-1');
      expect(res).toEqual({ success: true, id: 'dep-1' });

      // 双方向の削除履歴追加の検証
      expect(mockHistoryRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            taskId: 'task-2',
            actionType: 'TASK_DEPENDENCY_DELETED',
            changedBy: 'user-uuid-1234',
            comment: expect.stringContaining('依存関係が解除されました'),
          }),
          expect.objectContaining({
            taskId: 'task-1',
            actionType: 'TASK_DEPENDENCY_DELETED',
            changedBy: 'user-uuid-1234',
            comment: expect.stringContaining('依存関係が解除されました'),
          }),
        ]),
      );
    });
  });
});
