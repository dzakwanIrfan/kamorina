import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { FileUpload } from '../upload/decorators/file-upload.decorator';
import type { ICurrentUser } from '../auth/interfaces/current-user.interface';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: ICurrentUser) {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @CurrentUser() user: ICurrentUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @FileUpload('avatar')
  async uploadAvatar(
    @CurrentUser() user: ICurrentUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File avatar tidak ditemukan');
    }

    return this.profileService.uploadAvatar(user.id, file);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async deleteAvatar(@CurrentUser() user: ICurrentUser) {
    return this.profileService.deleteAvatar(user.id);
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: ICurrentUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(user.id, changePasswordDto);
  }
}