import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { OrganizationOrmEntity } from '../entities/organization.orm-entity';

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/organizations')
export class OrganizationController {
  constructor(private readonly entityManager: EntityManager) {}

  @Get()
  @ApiOperation({ summary: '組織（チーム）一覧の取得' })
  @ApiResponse({ status: 200, description: '取得成功' })
  async findAll() {
    const orgs = await this.entityManager.find(OrganizationOrmEntity, {
      order: { createdAt: 'ASC' },
    });
    return orgs;
  }

  @Post()
  @ApiOperation({ summary: '新規組織（チーム）の作成' })
  @ApiResponse({ status: 201, description: '作成成功' })
  async create(@Body() body: { name: string; code: string; parentId?: string }) {
    const id = randomUUID();
    const entity = this.entityManager.create(OrganizationOrmEntity, {
      id,
      name: body.name,
      code: body.code,
      parentId: body.parentId,
    });
    await this.entityManager.save(OrganizationOrmEntity, entity);
    return entity;
  }
}
