import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { v4 as uuid } from 'uuid';
import { db } from '../database/db.js';
import { wgEasy } from '../wg-easy/client.js';
import { addMonths, format } from 'date-fns';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const stripeRouter = express.Router();

// Create checkout session
stripeRouter.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email });
      customerId = customer.id;
    }

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}?canceled=true`,
      metadata: {
        email,
      },
    });

    // Create pending subscription record
    const subscriptionId = uuid();
    db.createSubscription({
      id: subscriptionId,
      stripeCustomerId: customerId,
      email,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get session status
stripeRouter.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['subscription', 'customer'],
    });
    res.json(session);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// Stripe webhook handler
export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ Webhook secret not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  console.log(`📩 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const email = session.customer_email || session.metadata?.email;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!email || !subscriptionId) {
    console.error('❌ Missing email or subscription ID');
    return;
  }

  console.log(`✅ Checkout complete for ${email}`);

  // Create WireGuard client
  const clientName = `vpn-${email.split('@')[0]}-${Date.now()}`;
  const expiresAt = addMonths(new Date(), 1);

  try {
    const { clientId } = await wgEasy.createClient(clientName, expiresAt);

    // Update subscription record
    db.updateSubscription(subscriptionId, {
      status: 'active',
      wgClientId: clientId,
      wgClientName: clientName,
      expiresAt: expiresAt.toISOString(),
    });

    // Also update the record by customer ID if subscription wasn't set yet
    const existingSub = db.getSubscriptionByCustomerId(customerId);
    if (existingSub && !existingSub.stripe_subscription_id) {
      db.updateSubscription(subscriptionId, {
        status: 'active',
        wgClientId: clientId,
        wgClientName: clientName,
        expiresAt: expiresAt.toISOString(),
      });
    }

    console.log(`✅ VPN client created for ${email}: ${clientId}`);
  } catch (error) {
    console.error(`❌ Failed to create VPN client for ${email}:`, error);
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const sub = db.getSubscription(subscriptionId);
  if (!sub?.wg_client_id) return;

  // Re-enable client and extend expiration
  try {
    await wgEasy.enableClient(sub.wg_client_id);
    db.updateSubscription(subscriptionId, {
      status: 'active',
      expiresAt: addMonths(new Date(), 1).toISOString(),
    });
    console.log(`✅ Subscription renewed for ${sub.email}`);
  } catch (error) {
    console.error(`❌ Failed to renew VPN for ${sub.email}:`, error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const sub = db.getSubscription(subscriptionId);
  if (!sub?.wg_client_id) return;

  // Disable VPN client on payment failure
  try {
    await wgEasy.disableClient(sub.wg_client_id);
    db.updateSubscription(subscriptionId, { status: 'payment_failed' });
    console.log(`⚠️ VPN disabled for ${sub.email} due to payment failure`);
  } catch (error) {
    console.error(`❌ Failed to disable VPN for ${sub.email}:`, error);
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const sub = db.getSubscription(subscription.id);
  if (!sub?.wg_client_id) return;

  // Disable VPN client when subscription is canceled
  try {
    await wgEasy.disableClient(sub.wg_client_id);
    db.updateSubscription(subscription.id, { status: 'canceled' });
    console.log(`✅ VPN disabled for canceled subscription: ${sub.email}`);
  } catch (error) {
    console.error(`❌ Failed to disable VPN on cancellation:`, error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const sub = db.getSubscription(subscription.id);
  if (!sub?.wg_client_id) return;

  // Handle status changes
  if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
    try {
      await wgEasy.disableClient(sub.wg_client_id);
      db.updateSubscription(subscription.id, { status: subscription.status });
      console.log(`⚠️ VPN disabled for ${sub.email}: ${subscription.status}`);
    } catch (error) {
      console.error(`❌ Failed to handle subscription update:`, error);
    }
  } else if (subscription.status === 'active' && sub.status !== 'active') {
    try {
      await wgEasy.enableClient(sub.wg_client_id);
      db.updateSubscription(subscription.id, { status: 'active' });
      console.log(`✅ VPN re-enabled for ${sub.email}`);
    } catch (error) {
      console.error(`❌ Failed to re-enable VPN:`, error);
    }
  }
}
