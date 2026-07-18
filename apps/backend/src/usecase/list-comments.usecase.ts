import { Comment } from '../domain/entities/comment.entity';
import { ICommentRepository } from '../domain/repositories/comment-repository.interface';

export class ListCommentsUseCase {
  constructor(private readonly commentRepository: ICommentRepository) {}

  async execute(taskId: string): Promise<Comment[]> {
    return this.commentRepository.findByTaskId(taskId);
  }
}
