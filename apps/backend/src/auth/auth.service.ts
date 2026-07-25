import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserOrmEntity } from '../infra/entities/user.orm-entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.entityManager.findOne(UserOrmEntity, {
      where: { email },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません。');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('メールアドレスまたはパスワードが正しくありません。');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        roleName: user.role?.name || 'ENGINEER',
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.entityManager.findOne(UserOrmEntity, {
      where: { id: userId },
      relations: { role: true },
    });

    if (!user) {
      throw new UnauthorizedException('ユーザーが見つかりません。');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role?.name || 'ENGINEER',
    };
  }
}
