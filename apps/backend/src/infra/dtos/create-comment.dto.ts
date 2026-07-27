import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiPropertyOptional({ description: '投稿ユーザーID (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'コメント本文' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
