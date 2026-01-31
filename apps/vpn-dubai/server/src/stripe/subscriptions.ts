import express, { Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../database/db.js';
import { wgEasy } from '../wg-easy/client.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const subscriptionsRouter = express.Router();

// Get subscription status by session ID
subscriptionsRouter.get('/status/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const sub = db.getSubscription(subscriptionId);
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found in database' });
    }

    res.json({
      status: sub.status,
      email: sub.email,
      wgClientId: sub.wg_client_id,
      expiresAt: sub.expires_at,
      createdAt: sub.created_at,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Get VPN configuration
subscriptionsRouter.get('/config/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const sub = db.getSubscription(subscriptionId);
    if (!sub?.wg_client_id) {
      return res.status(404).json({ error: 'VPN client not found' });
    }

    if (sub.status !== 'active') {
      return res.status(403).json({ error: 'Subscription is not active' });
    }

    const config = await wgEasy.getClientConfig(sub.wg_client_id);
    res.json({ config });
  } catch (error) {
    console.error('Error getting VPN config:', error);
    res.status(500).json({ error: 'Failed to get VPN configuration' });
  }
});

// Get VPN QR code
subscriptionsRouter.get('/qrcode/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const sub = db.getSubscription(subscriptionId);
    if (!sub?.wg_client_id) {
      return res.status(404).json({ error: 'VPN client not found' });
    }

    if (sub.status !== 'active') {
      return res.status(403).json({ error: 'Subscription is not active' });
    }

    const qrCode = await wgEasy.getClientQRCode(sub.wg_client_id);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(qrCode);
  } catch (error) {
    console.error('Error getting QR code:', error);
    res.status(500).json({ error: 'Failed to get QR code' });
  }
});

// Cancel subscription
subscriptionsRouter.post('/cancel/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['subscription'],
    });

    const subscriptionId = (session.subscription as Stripe.Subscription)?.id;
    if (!subscriptionId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    res.json({ success: true, message: 'Subscription will be canceled at the end of the billing period' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});
