import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  Headers,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { WebhookService } from './webhook.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private webhookService: WebhookService,
  ) {}

  @Post('create-checkout-session')
  async createCheckoutSession(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.stripeService.createCheckoutSession(email);
  }

  @Get('session/:sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    return this.stripeService.getSession(sessionId);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing stripe-signature header');
    }

    try {
      // Access raw body from the request
      const rawBody = (req as any).rawBody as Buffer;
      if (!rawBody) {
        return res.status(HttpStatus.BAD_REQUEST).send('Missing raw body');
      }

      const event = this.stripeService.constructWebhookEvent(rawBody, signature);
      await this.webhookService.handleEvent(event);

      return res.json({ received: true });
    } catch (err) {
      console.error('❌ Webhook error:', err);
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err}`);
    }
  }
}
