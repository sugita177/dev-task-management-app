import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserOrmEntity } from '../infra/entities/user.orm-entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
  roleName?: string;
  organizationId?: string;
  organizationName?: string;
  role?: { name: string };
  organization?: { name: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<AuthenticatedUser> {
    const user = await this.entityManager.findOne(UserOrmEntity, {
      where: { email },
      relations: { role: true, organization: true },
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

  async login(user: AuthenticatedUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        roleName: user.role?.name || user.roleName || 'ENGINEER',
        organizationId: user.organizationId || null,
        organizationName: user.organization?.name || user.organizationName || '開発第一チーム',
      },
    };
  }

  async getProfile(userId: string): Promise<AuthenticatedUser> {
    const user = await this.entityManager.findOne(UserOrmEntity, {
      where: { id: userId },
      relations: { role: true, organization: true },
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
      organizationId: user.organizationId || undefined,
      organizationName: user.organization?.name || '開発第一チーム',
    };
  }
}
