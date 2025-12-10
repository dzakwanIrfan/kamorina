import { Controller, Get, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { BukuTabunganService } from './buku-tabungan.service';

@Controller('buku-tabungan')
@UseGuards(JwtAuthGuard)
export class BukuTabunganController {
    constructor(
        private readonly bukuTabunganService: BukuTabunganService,
    ) {}

    @Get()
    async getMyTabungan(
        @CurrentUser() user: User
    ) {
        return this.bukuTabunganService.getTabunganByUserId(user.id);
    }
}
