import { Comment } from '../domain/entities/comment.entity';
import { ICommentRepository } from '../domain/repositories/comment-repository.interface';
import { ITaskRepository } from '../domain/repositories/task-repository.interface';
import { randomUUID } from 'crypto';

export interface CreateCommentDto {
  taskId: string;
  userId: string;
  content: string;
}

export class CreateCommentUseCase {
  constructor(
    private readonly commentRepository: ICommentRepository,
    private readonly taskRepository: ITaskRepository,
  ) {}

  async execute(dto: CreateCommentDto): Promise<Comment> {
    const task = await this.taskRepository.findById(dto.taskId);
    if (!task) {
      throw new Error(`Task with ID ${dto.taskId} not found`);
    }

    const comment = Comment.create({
      id: randomUUID(),
      taskId: dto.taskId,
      userId: dto.userId,
      content: dto.content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.commentRepository.save(comment);
    return comment;
  }
}
