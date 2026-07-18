import { Comment } from '../../domain/entities/comment.entity';
import { CommentOrmEntity } from '../entities/comment.orm-entity';

export class CommentDbMapper {
  static toDomain(orm: CommentOrmEntity): Comment {
    return Comment.create({
      id: orm.id,
      taskId: orm.taskId,
      userId: orm.userId,
      userName: orm.user?.name,
      content: orm.content,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Comment): CommentOrmEntity {
    const orm = new CommentOrmEntity();
    orm.id = domain.id;
    orm.taskId = domain.taskId;
    orm.userId = domain.userId;
    orm.content = domain.content;
    orm.createdAt = domain.createdAt;
    orm.updatedAt = domain.updatedAt;
    return orm;
  }
}
