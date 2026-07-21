import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IWorkLogRepository } from '../../domain/repositories/work-log-repository.interface';
import { WorkLog } from '../../domain/entities/work-log.entity';
import { WorkLogOrmEntity } from '../entities/work-log.orm-entity';
import { WorkLogDbMapper } from '../mappers/work-log-db.mapper';

@Injectable()
export class WorkLogRepository implements IWorkLogRepository {
  constructor(
    @InjectRepository(WorkLogOrmEntity)
    private readonly ormRepository: Repository<WorkLogOrmEntity>,
  ) {}

  async save(workLog: WorkLog): Promise<void> {
    const ormEntity = WorkLogDbMapper.toOrm(workLog);
    await this.ormRepository.save(ormEntity);
  }

  async findByTaskId(taskId: string): Promise<WorkLog[]> {
    const ormEntities = await this.ormRepository.find({
      where: { taskId },
      order: { loggedDate: 'DESC', createdAt: 'DESC' },
      relations: { user: true },
    });
    return ormEntities.map(ormEntity => WorkLogDbMapper.toDomain(ormEntity));
  }
}
