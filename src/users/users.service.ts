import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createAdmin(dto: CreateUserDto) {
    const email = dto.email.toLowerCase().trim();

    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new ConflictException('Admin email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.admin.create({
      data: { email, passwordHash },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async findAdminByEmail(email: string) {
    return this.prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findAdminById(id: string) {
    return this.prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }
}
