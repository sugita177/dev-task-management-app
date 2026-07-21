import { Comment } from '../entities/comment.entity';

export interface ICommentRepository {
  save(comment: Comment): Promise<void>;
  findByTaskId(taskId: string): Promise<Comment[]>;
}
