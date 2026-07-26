import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '有効なメールアドレスを入力してください。' })
  @IsNotEmpty({ message: 'メールアドレスは必須です。' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'パスワードは必須です。' })
  password: string;
}
