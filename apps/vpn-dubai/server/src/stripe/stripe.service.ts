import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  public readonly stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private db: DatabaseService,
  ) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });
  }

  async createCheckoutSession(email: string) {
    // Check if customer already exists
    const existingCustomers = await this.stripe.customers.list({ email, limit: 1 });
    let customerId: string;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await this.stripe.customers.create({ email });
      customerId = customer.id;
    }

    // Create checkout session for subscription
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: this.configService.get('STRIPE_PRICE_ID'),
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${this.configService.get('CLIENT_URL')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.configService.get('CLIENT_URL')}?canceled=true`,
      metadata: { email },
    });

    // Create pending subscription record
    const subscriptionId = uuid();
    this.db.createSubscription({
      id: subscriptionId,
      stripeCustomerId: customerId,
      email,
    });

    this.logger.log(`✅ Checkout session created for ${email}`);
    return { sessionId: session.id, url: session.url };
  }

  async getSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}
