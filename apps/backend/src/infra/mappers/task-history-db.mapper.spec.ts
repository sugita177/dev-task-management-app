import { TaskHistoryDbMapper } from './task-history-db.mapper';
import { TaskHistory } from '../../domain/entities/task-history.entity';
import { TaskHistoryOrmEntity } from '../entities/task-history.orm-entity';
import { UserOrmEntity } from '../entities/user.orm-entity';

describe('TaskHistoryDbMapper', () => {
  const mockDate = new Date('2026-08-01T10:00:00Z');

  describe('toDomain', () => {
    it('ORMエンティティ（changedByUserあり）をドメインエンティティに正しく変換できること', () => {
      const userOrm = new UserOrmEntity();
      userOrm.id = 'user-uuid-1';
      userOrm.name = '山田太郎';

      const ormEntity = new TaskHistoryOrmEntity();
      ormEntity.id = 'history-uuid-1';
      ormEntity.taskId = 'task-uuid-1';
      ormEntity.changedBy = 'user-uuid-1';
      ormEntity.changedByUser = userOrm;
      ormEntity.actionType = 'TASK_UPDATED';
      ormEntity.beforePayload = { title: 'Old Title', priority: 'LOW' };
      ormEntity.afterPayload = { title: 'New Title', priority: 'HIGH' };
      ormEntity.comment = 'タイトルと優先度を変更';
      ormEntity.changedAt = mockDate;

      const domainEntity = TaskHistoryDbMapper.toDomain(ormEntity);

      expect(domainEntity.id).toBe(ormEntity.id);
      expect(domainEntity.taskId).toBe(ormEntity.taskId);
      expect(domainEntity.changedBy).toBe(ormEntity.changedBy);
      expect(domainEntity.changedByName).toBe('山田太郎');
      expect(domainEntity.actionType).toBe(ormEntity.actionType);
      expect(domainEntity.beforePayload).toEqual(ormEntity.beforePayload);
      expect(domainEntity.afterPayload).toEqual(ormEntity.afterPayload);
      expect(domainEntity.comment).toBe('タイトルと優先度を変更');
      expect(domainEntity.changedAt).toEqual(mockDate);
    });

    it('ORMエンティティ（changedByUserなし）をドメインエンティティに正しく変換できること', () => {
      const ormEntity = new TaskHistoryOrmEntity();
      ormEntity.id = 'history-uuid-2';
      ormEntity.taskId = 'task-uuid-1';
      ormEntity.changedBy = 'user-uuid-2';
      ormEntity.actionType = 'TASK_CREATED';
      ormEntity.changedAt = mockDate;

      const domainEntity = TaskHistoryDbMapper.toDomain(ormEntity);

      expect(domainEntity.id).toBe(ormEntity.id);
      expect(domainEntity.changedByName).toBeUndefined();
      expect(domainEntity.comment).toBeUndefined();
    });
  });

  describe('toOrm', () => {
    it('ドメインエンティティをORMエンティティに正しく変換できること', () => {
      const domainEntity = TaskHistory.create({
        id: 'history-uuid-1',
        taskId: 'task-uuid-1',
        changedBy: 'user-uuid-1',
        actionType: 'TASK_UPDATED',
        beforePayload: { status: 'TODO' },
        afterPayload: { status: 'IN_PROGRESS' },
        comment: 'ステータス更新',
        changedAt: mockDate,
      });

      const ormEntity = TaskHistoryDbMapper.toOrm(domainEntity);

      expect(ormEntity.id).toBe(domainEntity.id);
      expect(ormEntity.taskId).toBe(domainEntity.taskId);
      expect(ormEntity.changedBy).toBe(domainEntity.changedBy);
      expect(ormEntity.actionType).toBe(domainEntity.actionType);
      expect(ormEntity.beforePayload).toEqual({ status: 'TODO' });
      expect(ormEntity.afterPayload).toEqual({ status: 'IN_PROGRESS' });
      expect(ormEntity.comment).toBe('ステータス更新');
      expect(ormEntity.changedAt).toEqual(mockDate);
    });

    it('beforePayloadやafterPayloadが空の場合でも正しくORMエンティティに変換できること', () => {
      const domainEntity = TaskHistory.create({
        id: 'history-uuid-3',
        taskId: 'task-uuid-2',
        changedBy: 'user-uuid-1',
        actionType: 'TASK_DELETED',
        changedAt: mockDate,
      });

      const ormEntity = TaskHistoryDbMapper.toOrm(domainEntity);

      expect(ormEntity.id).toBe(domainEntity.id);
      expect(ormEntity.beforePayload).toBeUndefined();
      expect(ormEntity.afterPayload).toBeUndefined();
      expect(ormEntity.comment).toBeUndefined();
    });
  });
});
