import { Task, TaskPriority, TaskProgressState } from '../domain/entities/task.entity';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { ITaskHistoryRepository } from '../domain/repositories/task-history-repository.interface';
import { TaskHistory } from '../domain/entities/task-history.entity';
import { randomUUID } from 'crypto';

export interface UpdateTaskDto {
  id: string;
  title?: string;
  description?: string;
  projectId?: string;
  assignedUserId?: string;
  progressState?: TaskProgressState;
  categoryId?: string;
  priority?: TaskPriority;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours?: number;
  changedBy?: string; // Who made the changes
}

export class UpdateTaskUseCase {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly taskHistoryRepository: ITaskHistoryRepository,
  ) {}

  private serializeTaskState(task: Task) {
    return {
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      ticketId: task.ticketId,
      assignedUserId: task.assignedUserId,
      progressState: task.progressState,
      categoryId: task.categoryId,
      priority: task.priority,
      plannedStartDate: task.plannedStartDate?.toISOString(),
      plannedEndDate: task.plannedEndDate?.toISOString(),
      estimatedHours: task.estimatedHours,
    };
  }

  async execute(dto: UpdateTaskDto): Promise<Task> {
    const task = await this.taskRepository.findById(dto.id);
    if (!task) {
      throw new Error(`Task with ID ${dto.id} not found`);
    }

    const beforePayload = this.serializeTaskState(task);

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
      projectId: dto.projectId,
      assignedUserId: dto.assignedUserId,
      categoryId: dto.categoryId,
      priority: dto.priority,
      estimatedHours: dto.estimatedHours,
    });

    await this.taskRepository.save(task);

    const afterPayload = this.serializeTaskState(task);

    // 変更の有無を確認
    const hasChanges = Object.keys(beforePayload).some(
      (key) => (beforePayload as any)[key] !== (afterPayload as any)[key]
    );

    if (hasChanges) {
      const history = TaskHistory.create({
        id: randomUUID(),
        taskId: task.id,
        changedBy: dto.changedBy || '00000000-0000-0000-0000-000000000401', // デフォルトでSatoshi Manager
        actionType: 'UPDATE',
        beforePayload,
        afterPayload,
        changedAt: new Date(),
      });
      await this.taskHistoryRepository.save(history);
    }

    return task;
  }
}

