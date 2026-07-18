import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { EntityManager } from 'typeorm';
import { ProjectOrmEntity } from '../entities/project.orm-entity';

describe('ProjectController', () => {
  let controller: ProjectController;
  let mockEntityManager: Partial<EntityManager>;

  beforeEach(async () => {
    mockEntityManager = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'proj-123',
          name: 'Test Project',
          isArchived: false,
          creator: { id: 'user-123', name: 'Test User' },
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('GET /projects が正常に動作し、プロジェクト一覧が返ること', async () => {
    const response = await controller.findAll();
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1);
    expect(response[0].id).toBe('proj-123');
    expect(response[0].name).toBe('Test Project');
    expect(mockEntityManager.find).toHaveBeenCalledWith(ProjectOrmEntity, {
      where: { isArchived: false },
      relations: { creator: true },
    });
  });
});
