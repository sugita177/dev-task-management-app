import { TaskHistory } from '../../domain/entities/task-history.entity';
import { TaskHistoryOrmEntity } from '../entities/task-history.orm-entity';

export class TaskHistoryDbMapper {
  static toDomain(orm: TaskHistoryOrmEntity): TaskHistory {
    return TaskHistory.create({
      id: orm.id,
      taskId: orm.taskId,
      changedBy: orm.changedBy,
      changedByName: orm.changedByUser?.name,
      actionType: orm.actionType,
      beforePayload: orm.beforePayload,
      afterPayload: orm.afterPayload,
      comment: orm.comment ?? undefined,
      changedAt: orm.changedAt,
    });
  }

  static toOrm(domain: TaskHistory): TaskHistoryOrmEntity {
    const orm = new TaskHistoryOrmEntity();
    orm.id = domain.id;
    orm.taskId = domain.taskId;
    orm.changedBy = domain.changedBy;
    orm.actionType = domain.actionType;
    orm.beforePayload = domain.beforePayload ?? undefined;
    orm.afterPayload = domain.afterPayload ?? undefined;
    orm.comment = domain.comment;
    orm.changedAt = domain.changedAt;
    return orm;
  }
}
