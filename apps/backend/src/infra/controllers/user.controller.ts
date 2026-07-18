import { Controller, Get } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Controller('users')
export class UserController {
  constructor(private readonly entityManager: EntityManager) {}

  @Get()
  async findAll() {
    return this.entityManager.find(UserOrmEntity, {
      relations: { role: true },
    });
  }
}
