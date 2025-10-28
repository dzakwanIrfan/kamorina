import { Module } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { LevelsController } from './levels.controller';

@Module({
  providers: [LevelsService],
  controllers: [LevelsController]
})
export class LevelsModule {}
