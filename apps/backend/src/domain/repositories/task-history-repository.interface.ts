import { TaskHistory } from '../entities/task-history.entity';

export interface ITaskHistoryRepository {
  save(history: TaskHistory): Promise<void>;
  findByTaskId(taskId: string): Promise<TaskHistory[]>;
}
