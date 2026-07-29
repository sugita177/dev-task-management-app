import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EntityManager } from 'typeorm';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CategoryOrmEntity } from '../entities/category.orm-entity';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/categories')
export class CategoryController {
  constructor(private readonly entityManager: EntityManager) {}

  @Get()
  @ApiOperation({ summary: 'カテゴリ一覧の取得' })
  @ApiResponse({ status: 200, description: '取得成功' })
  async findAll() {
    return this.entityManager.find(CategoryOrmEntity, {
      order: { createdAt: 'ASC' },
    });
  }
}
