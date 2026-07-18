import { Comment } from './comment.entity';

describe('Comment Domain Entity', () => {
  it('正常なコメントデータが生成できること', () => {
    const comment = Comment.create({
      id: 'comment-123',
      taskId: 'task-123',
      userId: 'user-123',
      content: 'テストコメントです',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(comment.id).toBe('comment-123');
    expect(comment.content).toBe('テストコメントです');
  });

  it('コメント本文が空の場合にエラーが発生すること', () => {
    expect(() => {
      Comment.create({
        id: 'comment-123',
        taskId: 'task-123',
        userId: 'user-123',
        content: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Comment content cannot be empty');

    expect(() => {
      Comment.create({
        id: 'comment-123',
        taskId: 'task-123',
        userId: 'user-123',
        content: '   ',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }).toThrow('Comment content cannot be empty');
  });
});
