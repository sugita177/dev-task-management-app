import { Task, TaskPriority, TaskProgressState } from '../domain/entities/task.entity';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
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
  constructor(private readonly taskRepository: ITaskRepository) {}

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
    return task;
  }
}
