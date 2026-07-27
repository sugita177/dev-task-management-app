import { Controller, Get, UseGuards } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ProjectOrmEntity } from '../entities/project.orm-entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
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
