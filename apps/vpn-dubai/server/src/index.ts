import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { stripeRouter, stripeWebhookHandler } from './stripe/stripe.js';
import { subscriptionsRouter } from './stripe/subscriptions.js';
import { db } from './database/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Webhook route needs raw body - must be before json middleware
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// CORS and JSON parsing for other routes
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5174',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/stripe', stripeRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
db.init();

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Dubai VPN Server                          ║
╠══════════════════════════════════════════════════════════════╣
║  API:      http://localhost:${PORT}/api                         ║
║  Webhook:  http://localhost:${PORT}/webhook/stripe              ║
╠══════════════════════════════════════════════════════════════╣
║  Environment: ${process.env.NODE_ENV || 'development'}                                ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
