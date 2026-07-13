import { Task } from '../domain/entities/task.entity';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';

export class ListTasksUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(): Promise<Task[]> {
    // 将来的にはここで絞り込み（フィルター）やソートをクエリから受け取るよう拡張します
    return this.taskRepository.findAll();
  }
}
