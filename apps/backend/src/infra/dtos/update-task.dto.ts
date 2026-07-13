import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { TaskPriority, TaskProgressState } from '../../domain/entities/task.entity';

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'タスクタイトル' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'タスクの説明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '担当エンジニアユーザーID (UUID)' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiPropertyOptional({ enum: TaskProgressState, description: '進捗ステータス' })
  @IsOptional()
  @IsEnum(TaskProgressState)
  progressState?: TaskProgressState;

  @ApiPropertyOptional({ description: 'カテゴリーID (UUID)' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: TaskPriority, description: '優先度' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: '計画開始日' })
  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @ApiPropertyOptional({ description: '計画終了日' })
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @ApiPropertyOptional({ description: '見積もり工数' })
  @IsOptional()
  @IsNumber()
  estimatedHours?: number;
}
