import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICommentRepository } from '../../domain/repositories/comment-repository.interface';
import { Comment } from '../../domain/entities/comment.entity';
import { CommentOrmEntity } from '../entities/comment.orm-entity';
import { CommentDbMapper } from '../mappers/comment-db.mapper';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(
    @InjectRepository(CommentOrmEntity)
    private readonly ormRepository: Repository<CommentOrmEntity>,
  ) {}

  async save(comment: Comment): Promise<void> {
    const ormEntity = CommentDbMapper.toOrm(comment);
    await this.ormRepository.save(ormEntity);
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    const ormEntities = await this.ormRepository.find({
      where: { taskId },
      order: { createdAt: 'ASC' },
      relations: { user: true },
    });
    return ormEntities.map(ormEntity => CommentDbMapper.toDomain(ormEntity));
  }
}
