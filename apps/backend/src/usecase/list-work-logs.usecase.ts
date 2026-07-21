import { WorkLog } from '../domain/entities/work-log.entity';
import { IWorkLogRepository } from '../domain/repositories/work-log-repository.interface';

export class ListWorkLogsUseCase {
  constructor(private readonly workLogRepository: IWorkLogRepository) {}

  async execute(taskId: string): Promise<WorkLog[]> {
    return this.workLogRepository.findByTaskId(taskId);
  }
}
