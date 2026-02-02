import { Module, Global } from '@nestjs/common';
import { WgEasyService } from './wg-easy.service';

@Global()
@Module({
  providers: [WgEasyService],
  exports: [WgEasyService],
})
export class WgEasyModule {}
