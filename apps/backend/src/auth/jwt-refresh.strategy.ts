import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          if (req && req.cookies && req.cookies.access_token) {
            return req.cookies.access_token;
          }
          return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        },
      ]),
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_SECRET || 'dev_secret_key_change_in_production',
    });
  }

  async validate(payload: { sub: string; email: string; name: string; roleId: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      roleId: payload.roleId,
    };
  }
}
