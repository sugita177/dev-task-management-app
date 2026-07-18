import { TaskHistory } from '../domain/entities/task-history.entity';
import { ITaskHistoryRepository } from '../domain/repositories/task-history-repository.interface';

export class ListTaskHistoriesUseCase {
  constructor(private readonly taskHistoryRepository: ITaskHistoryRepository) {}

  async execute(taskId: string): Promise<TaskHistory[]> {
    return this.taskHistoryRepository.findByTaskId(taskId);
  }
}
