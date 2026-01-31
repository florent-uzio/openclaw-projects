import { Module, Global } from '@nestjs/common';
import { BitoasisService } from './bitoasis.service';

@Global()
@Module({
  providers: [BitoasisService],
  exports: [BitoasisService],
})
export class BitoasisModule {}
