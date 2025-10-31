import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { EnvironmentVariables } from '../config/env.config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
    private configService: ConfigService<EnvironmentVariables>,
  ) {}

  async getUserProfile(userId: string) {
    console.log('Fetching user profile for userId:', userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            level: true,
          },
        },
        department: true,
        employee: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Remove sensitive data
    const {
      password: _,
      emailVerificationToken,
      passwordResetToken,
      passwordResetExpires,
      ...userWithoutSensitiveData
    } = user;

    return {
      user: {
        ...userWithoutSensitiveData,
        roles: user.roles.map((r) => r.level.levelName),
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { name, email, password, confPassword, employeeNumber } = registerDto;

    // Validate password confirmation
    if (password !== confPassword) {
      throw new BadRequestException('Password dan konfirmasi password tidak cocok');
    }

    // Check if employee number exists and is active
    const employee = await this.prisma.employee.findUnique({
      where: { employeeNumber },
    });

    if (!employee) {
      throw new BadRequestException(
        'Nomor Induk Karyawan tidak ditemukan di sistem. Hubungi HR/Admin.',
      );
    }

    if (!employee.isActive) {
      throw new BadRequestException(
        'Nomor Induk Karyawan tidak aktif. Hubungi HR/Admin.',
      );
    }

    // Check if employee number already used by another user
    const existingUserWithEmployee = await this.prisma.user.findFirst({
      where: { employeeId: employee.id },
    });

    if (existingUserWithEmployee) {
      throw new ConflictException(
        'Nomor Induk Karyawan sudah terdaftar oleh user lain.',
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');

    let user;

    try {
      // Create user with default role "anggota"
      user = await this.prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            emailVerificationToken,
            employeeId: employee.id,
          },
        });

        // Get or create "anggota" level
        let anggotaLevel = await tx.level.findFirst({
          where: { levelName: 'anggota' },
        });

        if (!anggotaLevel) {
          anggotaLevel = await tx.level.create({
            data: {
              levelName: 'anggota',
              description: 'Member/Anggota koperasi',
            },
          });
        }

        // Assign default role
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            levelId: anggotaLevel.id,
          },
        });

        return newUser;
      });

      // Try to send verification email
      try {
        await this.mailService.sendEmailVerification(
          user.email,
          user.name,
          emailVerificationToken,
        );
      } catch (emailError) {
        // Log the email error
        console.error('Email sending failed:', emailError);

        // Rollback: Delete the user that was just created
        await this.prisma.user.delete({
          where: { id: user.id },
        });

        // Throw user-friendly error
        if (emailError.message?.includes('RFC 2606')) {
          throw new BadRequestException(
            'Email tidak valid. Gunakan email domain yang valid (bukan example.com, test.com, dll)',
          );
        }

        if (emailError.code === 'EAUTH') {
          throw new InternalServerErrorException(
            'Konfigurasi email server bermasalah. Silakan hubungi administrator.',
          );
        }

        if (emailError.code === 'EENVELOPE') {
          throw new BadRequestException(
            'Email tidak dapat menerima pesan. Pastikan email Anda valid dan aktif.',
          );
        }

        // Generic email error
        throw new BadRequestException(
          'Gagal mengirim email verifikasi. Pastikan email Anda valid dan dapat menerima email.',
        );
      }

      return {
        message: 'Registrasi berhasil. Silakan cek email Anda untuk verifikasi.',
        email: user.email,
      };
    } catch (error) {
      // If error is already a NestJS exception, throw it as is
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log unexpected errors
      console.error('Registration error:', error);
      throw new BadRequestException('Terjadi kesalahan saat registrasi');
    }
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token verifikasi tidak valid');
    }

    const user = await this.prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new NotFoundException('Token verifikasi tidak ditemukan atau sudah digunakan');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email sudah terverifikasi sebelumnya');
    }

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          emailVerifiedAt: new Date(),
          emailVerificationToken: null,
        },
      });

      return {
        message: 'Email berhasil diverifikasi. Anda sekarang bisa login.',
      };
    } catch (error) {
      console.error('Email verification error:', error);
      throw new BadRequestException('Terjadi kesalahan saat verifikasi email');
    }
  }

  async login(loginDto: LoginDto) {
    const { emailOrNik, password } = loginDto;

    // Find user by email or NIK
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrNik }, { nik: emailOrNik }],
      },
      include: {
        roles: {
          include: {
            level: true,
          },
        },
        department: true,
        employee: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email/NIK atau password salah');
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Email belum diverifikasi. Silakan cek email Anda untuk verifikasi.',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email/NIK atau password salah');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.level.levelName),
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove sensitive data
    const {
      password: _,
      emailVerificationToken,
      passwordResetToken,
      ...userWithoutSensitiveData
    } = user;

    return {
      message: 'Login berhasil',
      accessToken,
      user: {
        ...userWithoutSensitiveData,
        roles: user.roles.map((r) => r.level.levelName),
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message:
          'Jika email terdaftar, link reset password akan dikirim ke email Anda.',
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new BadRequestException(
        'Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.',
      );
    }

    // Generate password reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        },
      });

      // Try to send password reset email
      try {
        await this.mailService.sendPasswordResetEmail(
          user.email,
          user.name,
          resetToken,
        );
      } catch (emailError) {
        console.error('Password reset email failed:', emailError);

        // Rollback token
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: null,
            passwordResetExpires: null,
          },
        });

        throw new BadRequestException(
          'Gagal mengirim email reset password. Pastikan email Anda valid dan dapat menerima email.',
        );
      }

      return {
        message:
          'Jika email terdaftar, link reset password akan dikirim ke email Anda.',
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      console.error('Forgot password error:', error);
      throw new BadRequestException('Terjadi kesalahan saat memproses permintaan');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password, confPassword } = resetPasswordDto;

    // Validate password confirmation
    if (password !== confPassword) {
      throw new BadRequestException('Password dan konfirmasi password tidak cocok');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Token reset password tidak valid atau sudah kadaluarsa',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      return {
        message: 'Password berhasil direset. Silakan login dengan password baru Anda.',
      };
    } catch (error) {
      console.error('Reset password error:', error);
      throw new BadRequestException('Terjadi kesalahan saat reset password');
    }
  }
}