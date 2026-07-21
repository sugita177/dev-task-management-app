import { WorkLog } from './work-log.entity';

describe('WorkLog Domain Entity', () => {
  it('正常な実績工数データが生成できること', () => {
    const workLog = WorkLog.create({
      id: 'wl-123',
      taskId: 'task-123',
      userId: 'user-123',
      loggedDate: new Date('2026-07-18'),
      hours: 4.5,
      description: '開発作業',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(workLog.id).toBe('wl-123');
    expect(workLog.hours).toBe(4.5);
    expect(workLog.description).toBe('開発作業');
  });

  it('工数が0以下の場合にエラーが発生すること', () => {
    expect(() => {
      WorkLog.create({
        id: 'wl-123',
        taskId: 'task-123',
        userId: 'user-123',
        loggedDate: new Date(),
        hours: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Work log hours must be greater than 0');

    expect(() => {
      WorkLog.create({
        id: 'wl-123',
        taskId: 'task-123',
        userId: 'user-123',
        loggedDate: new Date(),
        hours: -1.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Work log hours must be greater than 0');
  });
});
