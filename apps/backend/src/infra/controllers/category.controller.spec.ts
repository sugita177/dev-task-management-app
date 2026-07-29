import { CategoryController } from './category.controller';

describe('CategoryController', () => {
  let controller: CategoryController;
  let mockEntityManager: any;

  beforeEach(() => {
    mockEntityManager = {
      find: jest.fn().mockResolvedValue([
        { id: 'cat-1', name: '機能開発', code: 'FEATURE' },
        { id: 'cat-2', name: 'バグ修正', code: 'BUG_FIX' },
      ]),
    };
    controller = new CategoryController(mockEntityManager);
  });

  it('カテゴリ一覧を正常にDBから取得できること', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('機能開発');
    expect(mockEntityManager.find).toHaveBeenCalled();
  });
});
