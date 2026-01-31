import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeModule } from './stripe/stripe.module';
import { WgEasyModule } from './wg-easy/wg-easy.module';
import { DatabaseModule } from './database/database.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    WgEasyModule,
    StripeModule,
    SubscriptionsModule,
    AdminModule,
  ],
})
export class AppModule {}
