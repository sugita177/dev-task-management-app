import { WorkLog } from '../../domain/entities/work-log.entity';
import { WorkLogOrmEntity } from '../entities/work-log.orm-entity';

export class WorkLogDbMapper {
  static toDomain(orm: WorkLogOrmEntity): WorkLog {
    return WorkLog.create({
      id: orm.id,
      taskId: orm.taskId,
      userId: orm.userId,
      userName: orm.user?.name,
      loggedDate: new Date(orm.loggedDate),
      hours: orm.hours,
      description: orm.description ?? undefined,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: WorkLog): WorkLogOrmEntity {
    const orm = new WorkLogOrmEntity();
    orm.id = domain.id;
    orm.taskId = domain.taskId;
    orm.userId = domain.userId;
    orm.loggedDate = domain.loggedDate;
    orm.hours = domain.hours;
    orm.description = domain.description;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
