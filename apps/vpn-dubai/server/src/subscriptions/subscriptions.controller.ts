import { Controller, Get, Post, Param, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private subscriptionsService: SubscriptionsService) {}

  @Get('status/:sessionId')
  async getStatus(@Param('sessionId') sessionId: string) {
    return this.subscriptionsService.getStatusBySessionId(sessionId);
  }

  @Get('config/:sessionId')
  async getConfig(@Param('sessionId') sessionId: string) {
    return this.subscriptionsService.getConfigBySessionId(sessionId);
  }

  @Get('qrcode/:sessionId')
  @Header('Content-Type', 'image/svg+xml')
  async getQRCode(@Param('sessionId') sessionId: string, @Res() res: Response) {
    const qrCode = await this.subscriptionsService.getQRCodeBySessionId(sessionId);
    return res.send(qrCode);
  }

  @Post('cancel/:sessionId')
  async cancel(@Param('sessionId') sessionId: string) {
    return this.subscriptionsService.cancelBySessionId(sessionId);
  }
}
