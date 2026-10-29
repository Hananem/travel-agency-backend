import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

async login(email: string, password: string) {
  const admin = await this.prisma.admin.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new UnauthorizedException('Admin account not found');
  }

  const passwordMatches = await bcrypt.compare(
    password,
    admin.passwordHash,
  );

  if (!passwordMatches) {
    throw new UnauthorizedException('Password hash does not match');
  }

  const accessToken = await this.jwtService.signAsync({
    sub: admin.id,
    email: admin.email,
  });

  return {
    access_token: accessToken,
    admin: {
      id: admin.id,
      email: admin.email,
    },
  };
}
}