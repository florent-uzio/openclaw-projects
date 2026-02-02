import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import Stripe from 'stripe';
import { DatabaseService } from '../database/database.service';
import { WgEasyService } from '../wg-easy/wg-easy.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class SubscriptionsService {
  constructor(
    private db: DatabaseService,
    private wgEasy: WgEasyService,
    private stripeService: StripeService,
  ) {}

  async getStatusBySessionId(sessionId: string) {
    const session = await this.stripeService.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      throw new NotFoundException('Subscription not found');
    }

    const sub = this.db.getSubscription(subscriptionId);
    if (!sub) {
      throw new NotFoundException('Subscription not found in database');
    }

    return {
      status: sub.status,
      email: sub.email,
      wgClientId: sub.wg_client_id,
      expiresAt: sub.expires_at,
      createdAt: sub.created_at,
    };
  }

  async getConfigBySessionId(sessionId: string) {
    const session = await this.stripeService.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      throw new NotFoundException('Subscription not found');
    }

    const sub = this.db.getSubscription(subscriptionId);
    if (!sub?.wg_client_id) {
      throw new NotFoundException('VPN client not found');
    }

    if (sub.status !== 'active') {
      throw new ForbiddenException('Subscription is not active');
    }

    const config = await this.wgEasy.getClientConfig(sub.wg_client_id);
    return { config };
  }

  async getQRCodeBySessionId(sessionId: string): Promise<string> {
    const session = await this.stripeService.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      throw new NotFoundException('Subscription not found');
    }

    const sub = this.db.getSubscription(subscriptionId);
    if (!sub?.wg_client_id) {
      throw new NotFoundException('VPN client not found');
    }

    if (sub.status !== 'active') {
      throw new ForbiddenException('Subscription is not active');
    }

    return this.wgEasy.getClientQRCode(sub.wg_client_id);
  }

  async cancelBySessionId(sessionId: string) {
    const session = await this.stripeService.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      throw new NotFoundException('Subscription not found');
    }

    // Cancel at period end
    await this.stripeService.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true, message: 'Subscription will be canceled at the end of the billing period' };
  }
}
