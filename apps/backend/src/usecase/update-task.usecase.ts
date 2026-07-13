import { Task, TaskPriority, TaskProgressState } from '../domain/entities/task.entity';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';

export interface UpdateTaskDto {
  id: string;
  title?: string;
  description?: string;
  assignedUserId?: string;
  progressState?: TaskProgressState;
  categoryId?: string;
  priority?: TaskPriority;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours?: number;
}

export class UpdateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepository.findById(dto.id);
    if (!task) {
      throw new Error(`Task with ID ${dto.id} not found`);
    }

    // ステータスの変更（ドメインロジックの呼び出し）
    if (dto.progressState !== undefined) {
      task.changeProgressState(dto.progressState);
    }

    // 計画期間の変更（ドメインロジックの呼び出し）
    if (dto.plannedStartDate !== undefined || dto.plannedEndDate !== undefined) {
      const start = dto.plannedStartDate !== undefined ? dto.plannedStartDate : task.plannedStartDate;
      const end = dto.plannedEndDate !== undefined ? dto.plannedEndDate : task.plannedEndDate;
      task.updatePlannedDates(start, end);
    }

    // 基本情報の変更
    task.updateBasicInfo({
      title: dto.title,
      description: dto.description,
      assignedUserId: dto.assignedUserId,
      categoryId: dto.categoryId,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours,
    });

    await this.taskRepository.save(task);
    return task;
  }
}
