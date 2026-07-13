import { Task, TaskProgressState, TaskPriority } from '../../domain/entities/task.entity';
import { TaskOrmEntity } from '../entities/task.orm-entity';

// 固定値マスタのUUIDマッピング定義
export const ProgressStateUuidMap: Record<TaskProgressState, string> = {
  [TaskProgressState.BACKLOG]: '00000000-0000-0000-0000-000000000001',
  [TaskProgressState.IN_PROGRESS]: '00000000-0000-0000-0000-000000000002',
  [TaskProgressState.IN_REVIEW]: '00000000-0000-0000-0000-000000000003',
  [TaskProgressState.DONE]: '00000000-0000-0000-0000-000000000004',
};

export const ProgressStateDomainMap = Object.fromEntries(
  Object.entries(ProgressStateUuidMap).map(([k, v]) => [v, k])
) as Record<string, TaskProgressState>;

export const PriorityUuidMap: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: '00000000-0000-0000-0000-000000000101',
  [TaskPriority.MEDIUM]: '00000000-0000-0000-0000-000000000102',
  [TaskPriority.LOW]: '00000000-0000-0000-0000-000000000103',
};

export const PriorityDomainMap = Object.fromEntries(
  Object.entries(PriorityUuidMap).map(([k, v]) => [v, k])
) as Record<string, TaskPriority>;

export class TaskDbMapper {
  static toDomain(orm: TaskOrmEntity): Task {
    return Task.create({
      id: orm.id,
      title: orm.title,
      description: orm.description ?? undefined,
      projectId: orm.projectId,
      ticketId: orm.ticketId ?? undefined,
      assignedUserId: orm.assignedUserId ?? undefined,
      progressState: ProgressStateDomainMap[orm.progressStateId] || TaskProgressState.BACKLOG,
      categoryId: orm.categoryId,
      priority: PriorityDomainMap[orm.priorityId] || TaskPriority.MEDIUM,
      plannedStartDate: orm.plannedStartDate ? new Date(orm.plannedStartDate) : undefined,
      plannedEndDate: orm.plannedEndDate ? new Date(orm.plannedEndDate) : undefined,
      actualStartDate: orm.actualStartDate ? new Date(orm.actualStartDate) : undefined,
      actualEndDate: orm.actualEndDate ? new Date(orm.actualEndDate) : undefined,
      estimatedHours: orm.estimatedHours,
      createdBy: orm.createdBy,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
      deletedAt: orm.deletedAt ? new Date(orm.deletedAt) : undefined,
    });
  }

  static toOrm(domain: Task): TaskOrmEntity {
    const orm = new TaskOrmEntity();
    orm.id = domain.id;
    orm.title = domain.title;
    orm.description = domain.description;
    orm.projectId = domain.projectId;
    orm.ticketId = domain.ticketId;
    orm.assignedUserId = domain.assignedUserId;
    orm.progressStateId = ProgressStateUuidMap[domain.progressState];
    orm.categoryId = domain.categoryId;
    orm.priorityId = PriorityUuidMap[domain.priority];
    orm.plannedStartDate = domain.plannedStartDate;
    orm.plannedEndDate = domain.plannedEndDate;
    orm.actualStartDate = domain.actualStartDate;
    orm.actualEndDate = domain.actualEndDate;
    orm.estimatedHours = domain.estimatedHours;
    orm.createdBy = domain.createdBy;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
