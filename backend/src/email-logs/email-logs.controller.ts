import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { EmailLogsService } from './email-logs.service';
import { EmailLogQueryDto } from './dto/email-log-query.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Email Logs')
@Controller('email-logs')
export class EmailLogsController {
  constructor(private readonly emailLogsService: EmailLogsService) {}

  @Get()
  findAll(@Query() query: EmailLogQueryDto) {
    return this.emailLogsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailLogsService.findOne(id);
  }

  @Post(':id/resend')
  resend(@Param('id') id: string) {
    return this.emailLogsService.resend(id);
  }
}
