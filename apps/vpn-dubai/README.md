# Dubai VPN

Premium VPN service promotion and subscription management app with WireGuard integration.

## Features

- 🎨 Beautiful landing page for Dubai VPN service (€5/month)
- 💳 Stripe subscription integration
- 🔐 Automatic WireGuard client creation via wg-easy API
- 📱 QR code for easy mobile setup
- 🔄 Automatic client enable/disable based on payment status

## Architecture

```
apps/vpn-dubai/
├── src/                    # React frontend (Vite)
│   ├── pages/
│   │   └── Success.tsx     # Post-payment page with QR code
│   ├── App.tsx             # Landing page
│   └── styles/
├── server/                 # Express backend
│   └── src/
│       ├── stripe/         # Stripe checkout & webhooks
│       ├── wg-easy/        # WireGuard Easy API client
│       └── database/       # SQLite subscription storage
```

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_ID=price_xxx

# WG-Easy
WG_EASY_URL=http://localhost:51821
WG_EASY_USERNAME=admin
WG_EASY_PASSWORD=your_password

# Server
PORT=3001
CLIENT_URL=http://localhost:5174
```

### 2. Create Stripe Price

Create a recurring price in Stripe Dashboard:
- Amount: €5.00
- Interval: Monthly
- Copy the Price ID to `STRIPE_PRICE_ID`

### 3. Configure Stripe Webhook

For local development, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3001/webhook/stripe
```

For production, add webhook endpoint in Stripe Dashboard:
- URL: `https://yourdomain.com/webhook/stripe`
- Events: 
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.deleted`
  - `customer.subscription.updated`

### 4. Install & Run

```bash
# Install dependencies
npm install

# Run development server (both frontend + backend)
npm run dev
```

- Frontend: http://localhost:5174
- Backend API: http://localhost:3001

## How It Works

1. **User subscribes** → Stripe Checkout session created
2. **Payment succeeds** → Webhook triggers VPN client creation
3. **User gets QR code** → Scan with WireGuard app to connect
4. **Monthly renewal** → Automatic, client stays enabled
5. **Payment fails** → VPN client disabled automatically
6. **Subscription canceled** → VPN client disabled

## WG-Easy API

The app integrates with [wg-easy](https://github.com/wg-easy/wg-easy) running on port 51821:

- `POST /api/client` - Create new client
- `POST /api/client/{id}/enable` - Enable client
- `POST /api/client/{id}/disable` - Disable client
- `GET /api/client/{id}/qrcode.svg` - Get QR code
- `GET /api/client/{id}/configuration` - Get config file

## Production Deployment

1. Build the app: `npm run build`
2. Start production server: `npm start`
3. Configure reverse proxy (nginx/Caddy) for HTTPS
4. Update Stripe webhook URL
5. Set production environment variables
