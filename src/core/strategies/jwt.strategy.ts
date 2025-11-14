import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';

export interface JwtPayload {
  sub: string; // user ID
  email?: string | undefined;
  roles?: string[] | undefined;
  iat?: number | undefined;
  exp?: number | undefined;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const alg = configService.get<string>('JWT_ALG', 'RS256') as Algorithm;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_PUBLIC_KEY') ||
        configService.get<string>('JWT_SECRET') ||
        'secret',
      algorithms: [alg],
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const result: JwtPayload = {
      sub: payload.sub,
      roles: payload.roles || [],
    };
    if (payload.email) {
      result.email = payload.email;
    }
    if (payload.iat) {
      result.iat = payload.iat;
    }
    if (payload.exp) {
      result.exp = payload.exp;
    }
    return result;
  }
}
