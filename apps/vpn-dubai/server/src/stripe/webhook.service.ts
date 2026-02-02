import { Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { addMonths } from 'date-fns';
import { DatabaseService } from '../database/database.service';
import { WgEasyService } from '../wg-easy/wg-easy.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private db: DatabaseService,
    private wgEasy: WgEasyService,
  ) {}

  async handleEvent(event: Stripe.Event) {
    this.logger.log(`📩 Webhook received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const email = session.customer_email || session.metadata?.email;
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;

    if (!email || !subscriptionId) {
      this.logger.error('❌ Missing email or subscription ID');
      return;
    }

    this.logger.log(`✅ Checkout complete for ${email}`);

    // Create WireGuard client
    const clientName = `vpn-${email.split('@')[0]}-${Date.now()}`;
    const expiresAt = addMonths(new Date(), 1);

    try {
      const { clientId } = await this.wgEasy.createClient(clientName, expiresAt);

      // Update subscription record
      this.db.updateSubscription(subscriptionId, {
        status: 'active',
        wgClientId: clientId,
        wgClientName: clientName,
        expiresAt: expiresAt.toISOString(),
      });

      // Also update the record by customer ID if subscription wasn't set yet
      const existingSub = this.db.getSubscriptionByCustomerId(customerId);
      if (existingSub && !existingSub.stripe_subscription_id) {
        this.db.updateSubscription(subscriptionId, {
          status: 'active',
          wgClientId: clientId,
          wgClientName: clientName,
          expiresAt: expiresAt.toISOString(),
        });
      }

      this.logger.log(`✅ VPN client created for ${email}: ${clientId}`);
    } catch (error) {
      this.logger.error(`❌ Failed to create VPN client for ${email}:`, error);
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const sub = this.db.getSubscription(subscriptionId);
    if (!sub?.wg_client_id) return;

    try {
      await this.wgEasy.enableClient(sub.wg_client_id);
      this.db.updateSubscription(subscriptionId, {
        status: 'active',
        expiresAt: addMonths(new Date(), 1).toISOString(),
      });
      this.logger.log(`✅ Subscription renewed for ${sub.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to renew VPN for ${sub.email}:`, error);
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const sub = this.db.getSubscription(subscriptionId);
    if (!sub?.wg_client_id) return;

    try {
      await this.wgEasy.disableClient(sub.wg_client_id);
      this.db.updateSubscription(subscriptionId, { status: 'payment_failed' });
      this.logger.warn(`⚠️ VPN disabled for ${sub.email} due to payment failure`);
    } catch (error) {
      this.logger.error(`❌ Failed to disable VPN for ${sub.email}:`, error);
    }
  }

  private async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const sub = this.db.getSubscription(subscription.id);
    if (!sub?.wg_client_id) return;

    try {
      await this.wgEasy.disableClient(sub.wg_client_id);
      this.db.updateSubscription(subscription.id, { status: 'canceled' });
      this.logger.log(`✅ VPN disabled for canceled subscription: ${sub.email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to disable VPN on cancellation:`, error);
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const sub = this.db.getSubscription(subscription.id);
    if (!sub?.wg_client_id) return;

    if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
      try {
        await this.wgEasy.disableClient(sub.wg_client_id);
        this.db.updateSubscription(subscription.id, { status: subscription.status });
        this.logger.warn(`⚠️ VPN disabled for ${sub.email}: ${subscription.status}`);
      } catch (error) {
        this.logger.error(`❌ Failed to handle subscription update:`, error);
      }
    } else if (subscription.status === 'active' && sub.status !== 'active') {
      try {
        await this.wgEasy.enableClient(sub.wg_client_id);
        this.db.updateSubscription(subscription.id, { status: 'active' });
        this.logger.log(`✅ VPN re-enabled for ${sub.email}`);
      } catch (error) {
        this.logger.error(`❌ Failed to re-enable VPN:`, error);
      }
    }
  }
}
