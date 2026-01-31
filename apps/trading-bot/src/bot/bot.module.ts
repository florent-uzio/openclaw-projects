import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { BitoasisModule } from '../bitoasis/bitoasis.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [BitoasisModule, WebsocketModule],
  providers: [BotService],
  controllers: [BotController],
  exports: [BotService],
})
export class BotModule {}
