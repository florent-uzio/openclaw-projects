import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BotModule } from './bot/bot.module';
import { TradesModule } from './trades/trades.module';
import { BitoasisModule } from './bitoasis/bitoasis.module';
import { DatabaseModule } from './database/database.module';
import { WebsocketModule } from './websocket/websocket.module';
import { BotConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    BitoasisModule,
    BotConfigModule,
    BotModule,
    TradesModule,
    WebsocketModule,
  ],
})
export class AppModule {}
