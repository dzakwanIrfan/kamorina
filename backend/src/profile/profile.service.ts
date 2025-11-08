import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            level: true,
          },
        },
        employee: {
          include: {
            department: true,
            golongan: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const {
      password: _,
      emailVerificationToken,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitiveData
    } = user;

    return {
      ...userWithoutSensitiveData,
      roles: user.roles.map((r) => r.level.levelName),
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const updateData: any = {};

    if (updateProfileDto.name) {
      updateData.name = updateProfileDto.name;
    }

    if (updateProfileDto.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateProfileDto.dateOfBirth);
    }

    if (updateProfileDto.birthPlace) {
      updateData.birthPlace = updateProfileDto.birthPlace;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: {
          include: {
            level: true,
          },
        },
        employee: {
          include: {
            department: true,
            golongan: true,
          },
        },
      },
    });

    const {
      password: _,
      emailVerificationToken,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitiveData
    } = updatedUser;

    return {
      message: 'Profile berhasil diupdate',
      user: {
        ...userWithoutSensitiveData,
        roles: updatedUser.roles.map((r) => r.level.levelName),
      },
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File avatar tidak ditemukan');
    }

    this.uploadService.validateImageFile(file);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Delete old avatar if exists
    if (user.avatar) {
      const oldFilename = this.uploadService.extractFilename(user.avatar);
      if (oldFilename) {
        this.uploadService.deleteFile(oldFilename);
      }
    }

    const avatarUrl = this.uploadService.getFileUrl(file.filename);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      include: {
        roles: {
          include: {
            level: true,
          },
        },
        employee: {
          include: {
            department: true,
            golongan: true,
          },
        },
      },
    });

    const {
      password: _,
      emailVerificationToken,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitiveData
    } = updatedUser;

    return {
      message: 'Avatar berhasil diupdate',
      user: {
        ...userWithoutSensitiveData,
        roles: updatedUser.roles.map((r) => r.level.levelName),
      },
    };
  }

  async deleteAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    if (!user.avatar) {
      throw new BadRequestException('Tidak ada avatar untuk dihapus');
    }

    // Delete file
    const filename = this.uploadService.extractFilename(user.avatar);
    if (filename) {
      this.uploadService.deleteFile(filename);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      include: {
        roles: {
          include: {
            level: true,
          },
        },
        employee: {
          include: {
            department: true,
            golongan: true,
          },
        },
      },
    });

    const {
      password: _,
      emailVerificationToken,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitiveData
    } = updatedUser;

    return {
      message: 'Avatar berhasil dihapus',
      user: {
        ...userWithoutSensitiveData,
        roles: updatedUser.roles.map((r) => r.level.levelName),
      },
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Password baru dan konfirmasi password tidak cocok');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password lama tidak valid');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return {
      message: 'Password berhasil diubah',
    };
  }
}