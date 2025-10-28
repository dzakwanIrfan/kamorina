import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class MemberVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user.memberVerified) {
      throw new ForbiddenException(
        'Akses ditolak. Akun Anda belum diverifikasi sebagai member. Silakan lengkapi data dan tunggu approval.',
      );
    }

    return true;
  }
}