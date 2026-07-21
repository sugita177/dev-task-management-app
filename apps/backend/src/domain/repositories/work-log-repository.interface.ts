import { WorkLog } from '../entities/work-log.entity';

export interface IWorkLogRepository {
  save(workLog: WorkLog): Promise<void>;
  findByTaskId(taskId: string): Promise<WorkLog[]>;
}
