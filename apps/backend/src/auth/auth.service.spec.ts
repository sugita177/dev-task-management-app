import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let entityManager: jest.Mocked<Partial<EntityManager>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(async () => {
    entityManager = {
      findOne: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EntityManager, useValue: entityManager },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object without passwordHash on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
        name: 'Test User',
        roleId: 'role-1',
        role: { name: 'ENGINEER' },
      };

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toEqual('test@example.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash,
      };

      (entityManager.findOne as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.validateUser('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('login', () => {
    it('should return accessToken and user profile', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        roleId: 'role-1',
        role: { name: 'ENGINEER' },
      };

      const result = await service.login(user);

      expect(result.accessToken).toEqual('mock_jwt_token');
      expect(result.user.name).toEqual('Test User');
    });
  });
});
