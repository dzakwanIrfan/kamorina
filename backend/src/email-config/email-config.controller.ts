import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EmailConfigService } from './email-config.service';
import { CreateEmailConfigDto } from './dto/create-email-config.dto';
import { UpdateEmailConfigDto } from './dto/update-email-config.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Email Config')
@Controller('email-configs')
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  @Post()
  create(@Body() createEmailConfigDto: CreateEmailConfigDto) {
    return this.emailConfigService.create(createEmailConfigDto);
  }

  @Get()
  findAll() {
    return this.emailConfigService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailConfigService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmailConfigDto: UpdateEmailConfigDto,
  ) {
    return this.emailConfigService.update(id, updateEmailConfigDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailConfigService.remove(id);
  }
}
