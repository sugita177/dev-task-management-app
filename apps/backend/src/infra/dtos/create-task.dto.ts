import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { TaskPriority } from '../../domain/entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ description: 'タスクタイトル' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'タスクの説明' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'プロジェクトID (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: '連携外部チケットID (UUID)' })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({ description: '担当エンジニアユーザーID (UUID)' })
  @IsOptional()
  @IsUUID()
  assignedUserId?: string;

  @ApiProperty({ description: 'カテゴリーID (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({ enum: TaskPriority, description: '優先度 (HIGH / MEDIUM / LOW)' })
  @IsNotEmpty()
  @IsEnum(TaskPriority)
  priority: TaskPriority;

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

  @ApiPropertyOptional({ description: '起票者ユーザーID (UUID)' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
