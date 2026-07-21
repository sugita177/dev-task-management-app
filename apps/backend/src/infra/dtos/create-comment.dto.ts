import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: '投稿ユーザーID (UUID)' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'コメント本文' })
  @IsNotEmpty()
  @IsString()
  content: string;
}
