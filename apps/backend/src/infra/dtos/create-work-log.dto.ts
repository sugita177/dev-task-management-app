import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateWorkLogDto {
  @ApiProperty({ description: '作業ユーザーID (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: '作業日' })
  @IsNotEmpty()
  @IsDateString()
  loggedDate: string;

  @ApiProperty({ description: '作業時間' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  hours: number;

  @ApiPropertyOptional({ description: '作業内容説明' })
  @IsOptional()
  @IsString()
  description?: string;
}
