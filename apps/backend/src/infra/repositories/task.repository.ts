import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITaskRepository } from '../../domain/repositories/task-repository.interface';
import { Task } from '../../domain/entities/task.entity';
import { TaskOrmEntity } from '../entities/task.orm-entity';
import { TaskDbMapper } from '../mappers/task-db.mapper';

@Injectable()
export class TaskRepository implements ITaskRepository {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly ormRepository: Repository<TaskOrmEntity>,
  ) {}

  async save(task: Task): Promise<void> {
    const ormEntity = TaskDbMapper.toOrm(task);
    await this.ormRepository.save(ormEntity);
  }

  async findById(id: string): Promise<Task | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) return null;
    return TaskDbMapper.toDomain(ormEntity);
  }

  async findAll(): Promise<Task[]> {
    const ormEntities = await this.ormRepository.find();
    return ormEntities.map(ormEntity => TaskDbMapper.toDomain(ormEntity));
  }
}
