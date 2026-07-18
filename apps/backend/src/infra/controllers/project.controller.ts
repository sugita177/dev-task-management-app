import { Controller, Get } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ProjectOrmEntity } from '../entities/project.orm-entity';

@Controller('projects')
export class ProjectController {
  constructor(private readonly entityManager: EntityManager) {}

  @Get()
  async findAll() {
    return this.entityManager.find(ProjectOrmEntity, {
      where: { isArchived: false },
      relations: { creator: true },
    });
  }
}
