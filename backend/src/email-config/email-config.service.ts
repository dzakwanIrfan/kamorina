import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailConfigDto } from './dto/create-email-config.dto';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { EncryptionUtil } from '../common/utils/encryption.util';

@Injectable()
export class EmailConfigService {
  constructor(
    private prisma: PrismaService,
    private encryptionUtil: EncryptionUtil,
  ) {}

  async create(dto: CreateEmailConfigDto) {
    if (dto.isActive) {
      // Deactivate others
      await this.prisma.email.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const encryptedPassword = this.encryptionUtil.encrypt(dto.password);

    return this.prisma.email.create({
      data: {
        ...dto,
        password: encryptedPassword,
      },
    });
  }

  async findAll() {
    return this.prisma.email.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        host: true,
        port: true,
        username: true,
        fromName: true,
        isActive: true,
        label: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const email = await this.prisma.email.findUnique({
      where: { id },
    });
    if (!email) throw new NotFoundException('Email config not found');
    return email;
  }

  async update(id: string, dto: UpdateEmailConfigDto) {
    if (dto.isActive === true) {
      await this.prisma.email.updateMany({
        where: { isActive: true, id: { not: id } },
        data: { isActive: false },
      });
    }

    const data: any = { ...dto };
    if (dto.password) {
      data.password = this.encryptionUtil.encrypt(dto.password);
    }

    return this.prisma.email.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.email.delete({
      where: { id },
    });
  }
}
