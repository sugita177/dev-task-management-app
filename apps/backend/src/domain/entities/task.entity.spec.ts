import { Task, TaskProgressState, TaskPriority } from './task.entity';

describe('Task Entity', () => {
  const baseProps = {
    id: 'task-1',
    title: 'Test Task',
    projectId: 'proj-1',
    progressState: TaskProgressState.BACKLOG,
    categoryId: 'cat-1',
    priority: TaskPriority.MEDIUM,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('正常なプロパティでタスクが作成できること', () => {
    const task = Task.create(baseProps);
    expect(task.id).toBe('task-1');
    expect(task.title).toBe('Test Task');
    expect(task.progressState).toBe(TaskProgressState.BACKLOG);
  });

  it('計画開始日が計画終了日より後の場合はエラーになること', () => {
    expect(() => {
      Task.create({
        ...baseProps,
        plannedStartDate: new Date('2026-07-20'),
        plannedEndDate: new Date('2026-07-10'),
      });
    }).toThrow('planned_start_date cannot be after planned_end_date');
  });

  it('進捗が IN_PROGRESS に変わった際、実績開始日が自動設定されること', () => {
    const task = Task.create(baseProps);
    expect(task.actualStartDate).toBeUndefined();

    task.changeProgressState(TaskProgressState.IN_PROGRESS);

    expect(task.progressState).toBe(TaskProgressState.IN_PROGRESS);
    expect(task.actualStartDate).toBeInstanceOf(Date);
  });

  it('進捗が DONE に変わった際、実績終了日が自動設定されること', () => {
    const task = Task.create(baseProps);
    expect(task.actualEndDate).toBeUndefined();

    task.changeProgressState(TaskProgressState.DONE);

    expect(task.progressState).toBe(TaskProgressState.DONE);
    expect(task.actualEndDate).toBeInstanceOf(Date);
  });

  it('日付更新メソッドで正しい日付が設定されること', () => {
    const task = Task.create(baseProps);
    
    const start = new Date('2026-08-01');
    const end = new Date('2026-08-05');
    
    task.updatePlannedDates(start, end);
    expect(task.plannedStartDate).toBe(start);
    expect(task.plannedEndDate).toBe(end);
  });
});
