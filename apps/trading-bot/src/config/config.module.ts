import { Module } from '@nestjs/common';
import { BotConfigService } from './config.service';
import { BotConfigController } from './config.controller';

@Module({
  providers: [BotConfigService],
  controllers: [BotConfigController],
  exports: [BotConfigService],
})
export class BotConfigModule {}
