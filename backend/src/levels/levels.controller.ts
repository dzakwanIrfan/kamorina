import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LevelsService } from './levels.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { QueryLevelDto } from './dto/query-level.dto';
import { AssignUserDto } from './dto/assign-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('levels')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Post()
  @Roles('ketua')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelsService.create(createLevelDto);
  }

  @Get()
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  findAll(@Query() query: QueryLevelDto) {
    return this.levelsService.findAll(query);
  }

  @Get(':id')
  @Roles('ketua', 'divisi_simpan_pinjam', 'pengawas')
  findOne(@Param('id') id: string) {
    return this.levelsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ketua')
  update(@Param('id') id: string, @Body() updateLevelDto: UpdateLevelDto) {
    return this.levelsService.update(id, updateLevelDto);
  }

  @Delete(':id')
  @Roles('ketua')
  remove(@Param('id') id: string) {
    return this.levelsService.remove(id);
  }

  @Post(':id/users')
  @Roles('ketua')
  @HttpCode(HttpStatus.OK)
  assignUser(@Param('id') id: string, @Body() assignUserDto: AssignUserDto) {
    return this.levelsService.assignUser(id, assignUserDto);
  }

  @Delete(':id/users/:userId')
  @Roles('ketua')
  removeUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.levelsService.removeUser(id, userId);
  }
}
