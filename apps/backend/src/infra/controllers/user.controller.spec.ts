import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { EntityManager } from 'typeorm';
import { UserOrmEntity } from '../entities/user.orm-entity';

describe('UserController', () => {
  let controller: UserController;
  let mockEntityManager: Partial<EntityManager>;

  beforeEach(async () => {
    mockEntityManager = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          role: { id: 'role-123', name: 'ADMINISTRATOR' },
        },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('GET /users が正常に動作し、ユーザー一覧が返ること', async () => {
    const response = await controller.findAll();
    expect(response).toBeInstanceOf(Array);
    expect(response.length).toBe(1);
    expect(response[0].id).toBe('user-123');
    expect(response[0].name).toBe('Test User');
    expect(response[0].role.name).toBe('ADMINISTRATOR');
    expect(mockEntityManager.find).toHaveBeenCalledWith(UserOrmEntity, {
      relations: { role: true },
    });
  });
});
