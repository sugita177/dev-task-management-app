import { Task, TaskPriority, TaskProgressState } from '../domain/entities/task.entity';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { ITaskHistoryRepository } from '../domain/repositories/task-history-repository.interface';
import { TaskHistory } from '../domain/entities/task-history.entity';
import { randomUUID } from 'crypto';

export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: string;
  ticketId?: string;
  assignedUserId?: string;
  categoryId: string;
  priority: TaskPriority;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours?: number;
  createdBy: string;
}

export class CreateTaskUseCase {
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

  async execute(dto: CreateTaskDto): Promise<Task> {
    const now = new Date();
    const task = Task.create({
      id: randomUUID(),
      title: dto.title,
      description: dto.description,
      projectId: dto.projectId,
      ticketId: dto.ticketId,
      assignedUserId: dto.assignedUserId,
      progressState: TaskProgressState.BACKLOG,
      categoryId: dto.categoryId,
      priority: dto.priority,
      plannedStartDate: dto.plannedStartDate,
      plannedEndDate: dto.plannedEndDate,
      estimatedHours: dto.estimatedHours,
      createdBy: dto.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    await this.taskRepository.save(task);

    const history = TaskHistory.create({
      id: randomUUID(),
      taskId: task.id,
      changedBy: dto.createdBy,
      actionType: 'CREATE',
      beforePayload: null,
      afterPayload: this.serializeTaskState(task),
      changedAt: now,
    });
    await this.taskHistoryRepository.save(history);

    return task;
  }
}
