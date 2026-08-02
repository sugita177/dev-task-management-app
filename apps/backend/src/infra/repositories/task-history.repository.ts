import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITaskHistoryRepository } from '../../domain/repositories/task-history-repository.interface';
import { TaskHistory } from '../../domain/entities/task-history.entity';
import { TaskHistoryOrmEntity } from '../entities/task-history.orm-entity';
import { TaskHistoryDbMapper } from '../mappers/task-history-db.mapper';

@Injectable()
export class TaskHistoryRepository implements ITaskHistoryRepository {
  constructor(
    @InjectRepository(TaskHistoryOrmEntity)
    private readonly ormRepository: Repository<TaskHistoryOrmEntity>,
  ) {}

  async save(history: TaskHistory): Promise<void> {
    const ormEntity = TaskHistoryDbMapper.toOrm(history);
    await this.ormRepository.save(ormEntity);
  }

  async findByTaskId(taskId: string): Promise<TaskHistory[]> {
    const ormEntities = await this.ormRepository.find({
      where: { taskId },
      order: { changedAt: 'DESC' },
      relations: { changedByUser: true },
    });
    return ormEntities.map(ormEntity => TaskHistoryDbMapper.toDomain(ormEntity));
  }
}
