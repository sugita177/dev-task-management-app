import { WorkLog } from '../domain/entities/work-log.entity';
import { IWorkLogRepository } from '../domain/repositories/work-log-repository.interface';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { randomUUID } from 'crypto';

export interface CreateWorkLogDto {
  taskId: string;
  userId: string;
  loggedDate: Date;
  hours: number;
  description?: string;
}

export class CreateWorkLogUseCase {
  constructor(
    private readonly workLogRepository: IWorkLogRepository,
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(dto: CreateWorkLogDto): Promise<WorkLog> {
    const task = await this.taskRepository.findById(dto.taskId);
    if (!task) {
      throw new Error(`Task with ID ${dto.taskId} not found`);
    }

    const workLog = WorkLog.create({
      id: randomUUID(),
      taskId: dto.taskId,
      userId: dto.userId,
      loggedDate: dto.loggedDate,
      hours: dto.hours,
      description: dto.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.workLogRepository.save(workLog);
    return workLog;
  }
}
