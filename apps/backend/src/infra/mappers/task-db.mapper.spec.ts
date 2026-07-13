import { TaskDbMapper, ProgressStateUuidMap, PriorityUuidMap, ProgressStateDomainMap, PriorityDomainMap } from './task-db.mapper';
import { Task, TaskProgressState, TaskPriority } from '../../domain/entities/task.entity';
import { TaskOrmEntity } from '../entities/task.orm-entity';

describe('TaskDbMapper', () => {
  const mockDomainTaskProps = {
    id: 'task-uuid-123',
    title: 'Domain Task Title',
    description: 'Task Description',
    projectId: 'project-uuid-1',
    ticketId: 'ticket-uuid-1',
    assignedUserId: 'user-uuid-1',
    progressState: TaskProgressState.IN_PROGRESS,
    categoryId: 'category-uuid-1',
    priority: TaskPriority.HIGH,
    plannedStartDate: new Date('2026-07-15'),
    plannedEndDate: new Date('2026-07-20'),
    actualStartDate: new Date('2026-07-16'),
    actualEndDate: undefined,
    estimatedHours: 4.5,
    createdBy: 'user-uuid-99',
    createdAt: new Date('2026-07-10T10:00:00Z'),
    updatedAt: new Date('2026-07-12T12:00:00Z'),
  };

  describe('toOrm', () => {
    it('ドメインエンティティをORMエンティティに正しく変換できること', () => {
      const domainTask = Task.create(mockDomainTaskProps);
      const ormEntity = TaskDbMapper.toOrm(domainTask);

      expect(ormEntity.id).toBe(mockDomainTaskProps.id);
      expect(ormEntity.title).toBe(mockDomainTaskProps.title);
      expect(ormEntity.description).toBe(mockDomainTaskProps.description);
      expect(ormEntity.projectId).toBe(mockDomainTaskProps.projectId);
      expect(ormEntity.ticketId).toBe(mockDomainTaskProps.ticketId);
      expect(ormEntity.assignedUserId).toBe(mockDomainTaskProps.assignedUserId);
      
      // EnumからマスタUUIDへのマッピング検証
      expect(ormEntity.progressStateId).toBe(ProgressStateUuidMap[TaskProgressState.IN_PROGRESS]);
      expect(ormEntity.priorityId).toBe(PriorityUuidMap[TaskPriority.HIGH]);

      expect(ormEntity.plannedStartDate).toEqual(mockDomainTaskProps.plannedStartDate);
      expect(ormEntity.plannedEndDate).toEqual(mockDomainTaskProps.plannedEndDate);
      expect(ormEntity.actualStartDate).toEqual(mockDomainTaskProps.actualStartDate);
      expect(ormEntity.actualEndDate).toBeUndefined();
      expect(ormEntity.estimatedHours).toBe(mockDomainTaskProps.estimatedHours);
      expect(ormEntity.createdBy).toBe(mockDomainTaskProps.createdBy);
      expect(ormEntity.createdAt).toEqual(mockDomainTaskProps.createdAt);
      expect(ormEntity.updatedAt).toEqual(mockDomainTaskProps.updatedAt);
    });
  });

  describe('toDomain', () => {
    it('ORMエンティティをドメインエンティティに正しく変換できること', () => {
      const ormEntity = new TaskOrmEntity();
      ormEntity.id = 'task-uuid-123';
      ormEntity.title = 'ORM Task Title';
      ormEntity.description = 'ORM Description';
      ormEntity.projectId = 'project-uuid-1';
      ormEntity.ticketId = 'ticket-uuid-1';
      ormEntity.assignedUserId = 'user-uuid-1';
      ormEntity.progressStateId = ProgressStateUuidMap[TaskProgressState.DONE];
      ormEntity.categoryId = 'category-uuid-1';
      ormEntity.priorityId = PriorityUuidMap[TaskPriority.LOW];
      ormEntity.plannedStartDate = new Date('2026-07-15');
      ormEntity.plannedEndDate = new Date('2026-07-20');
      ormEntity.actualStartDate = new Date('2026-07-16');
      ormEntity.actualEndDate = new Date('2026-07-19');
      ormEntity.estimatedHours = 8;
      ormEntity.createdBy = 'user-uuid-99';
      ormEntity.createdAt = new Date('2026-07-10T10:00:00Z');
      ormEntity.updatedAt = new Date('2026-07-12T12:00:00Z');
      ormEntity.deletedAt = undefined;

      const domainTask = TaskDbMapper.toDomain(ormEntity);

      expect(domainTask.id).toBe(ormEntity.id);
      expect(domainTask.title).toBe(ormEntity.title);
      expect(domainTask.description).toBe(ormEntity.description);
      expect(domainTask.projectId).toBe(ormEntity.projectId);
      expect(domainTask.ticketId).toBe(ormEntity.ticketId);
      expect(domainTask.assignedUserId).toBe(ormEntity.assignedUserId);
      
      // マスタUUIDからEnumへのマッピング検証
      expect(domainTask.progressState).toBe(TaskProgressState.DONE);
      expect(domainTask.priority).toBe(TaskPriority.LOW);

      expect(domainTask.plannedStartDate).toEqual(ormEntity.plannedStartDate);
      expect(domainTask.plannedEndDate).toEqual(ormEntity.plannedEndDate);
      expect(domainTask.actualStartDate).toEqual(ormEntity.actualStartDate);
      expect(domainTask.actualEndDate).toEqual(ormEntity.actualEndDate);
      expect(domainTask.estimatedHours).toBe(ormEntity.estimatedHours);
      expect(domainTask.createdBy).toBe(ormEntity.createdBy);
      expect(domainTask.createdAt).toEqual(ormEntity.createdAt);
      expect(domainTask.updatedAt).toEqual(ormEntity.updatedAt);
    });
  });
});
