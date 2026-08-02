import { OrganizationController } from './organization.controller';
import { EntityManager } from 'typeorm';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let mockEntityManager: Partial<EntityManager>;

  beforeEach(() => {
    mockEntityManager = {
      find: jest.fn().mockResolvedValue([
        { id: 'org-1', name: '開発第一チーム', code: 'DEV_DIV_1' },
        { id: 'org-2', name: 'SREチーム', code: 'SRE_TEAM' },
      ]),
      create: jest.fn().mockImplementation((entityClass, data) => data),
      save: jest.fn().mockImplementation((entityClass, data) => Promise.resolve(data)),
    };

    controller = new OrganizationController(mockEntityManager as EntityManager);
  });

  it('組織（チーム）一覧を正常に取得できること', async () => {
    const result = await controller.findAll();
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('開発第一チーム');
    expect(mockEntityManager.find).toHaveBeenCalled();
  });

  it('新規組織（チーム）を作成できること', async () => {
    const dto = { name: 'QAチーム', code: 'QA_TEAM' };
    const result = await controller.create(dto);
    expect(result.name).toBe('QAチーム');
    expect(result.code).toBe('QA_TEAM');
    expect(mockEntityManager.save).toHaveBeenCalled();
  });
});
