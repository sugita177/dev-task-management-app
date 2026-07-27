import { TaskController } from './task.controller';

describe('TaskController (Unit Test for JWT User Binding)', () => {
  let controller: TaskController;
  let mockCreateTaskUseCase: any;
  let mockUpdateTaskUseCase: any;
  let mockGetTaskUseCase: any;
  let mockListTasksUseCase: any;
  let mockCreateCommentUseCase: any;
  let mockListCommentsUseCase: any;
  let mockCreateWorkLogUseCase: any;
  let mockListWorkLogsUseCase: any;
  let mockListTaskHistoriesUseCase: any;

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

    controller = new TaskController(
      mockCreateTaskUseCase,
      mockUpdateTaskUseCase,
      mockGetTaskUseCase,
      mockListTasksUseCase,
      mockCreateCommentUseCase,
      mockListCommentsUseCase,
      mockCreateWorkLogUseCase,
      mockListWorkLogsUseCase,
      mockListTaskHistoriesUseCase,
    );
  });

  it('タスク作成時に req.user.userId が createdBy へ自動セットされること', async () => {
    const dto: any = {
      title: 'New Task',
      projectId: 'proj-1',
      categoryId: 'cat-1',
      priority: 'HIGH',
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
    const dto: any = {
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
    const dto: any = {
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
    const dto: any = {
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
});
