import { Task } from '../domain/entities/task.entity';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';

export class GetTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(id: string): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new Error(`Task with ID ${id} not found`);
    }
    return task;
  }
}
