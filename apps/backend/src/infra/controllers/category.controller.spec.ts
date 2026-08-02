import { CategoryController } from './category.controller';
import { EntityManager } from 'typeorm';

describe('CategoryController', () => {
  let controller: CategoryController;
  let mockEntityManager: Partial<EntityManager>;

  beforeEach(() => {
    mockEntityManager = {
      find: jest.fn().mockResolvedValue([
        { id: 'cat-1', name: '機能開発', code: 'FEATURE' },
        { id: 'cat-2', name: 'バグ修正', code: 'BUG_FIX' },
      ]),
      create: jest.fn().mockImplementation((entityClass, data) => data),
      save: jest.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
    };

    controller = new CategoryController(mockEntityManager as EntityManager);
  });

  it('カテゴリマスタ一覧を正常に取得できること', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('機能開発');
    expect(mockEntityManager.find).toHaveBeenCalled();
  });
});
