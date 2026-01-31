# OpenClaw Trading Projects

A monorepo for cryptocurrency trading tools, starting with an XRP trading bot for BitOasis.

## 🏗️ Structure

```
openclaw-projects/
├── apps/
│   ├── trading-bot/     # NestJS trading bot
│   └── dashboard/       # React dashboard
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── config/          # Shared configuration
│   └── utils/           # Shared utilities
├── turbo.json           # Turborepo configuration
└── package.json         # Root workspace config
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 10

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp apps/trading-bot/.env.example apps/trading-bot/.env
```

### Development

```bash
# Start both bot and dashboard in development mode
npm run dev

# Or start individually
npm run dev --filter=@openclaw/trading-bot
npm run dev --filter=@openclaw/dashboard
```

### Access

- **Dashboard**: http://localhost:5173
- **Bot API**: http://localhost:3000/api
- **API Docs**: http://localhost:3000/docs

## 🤖 Trading Bot

### Features

- **Paper Trading Mode** (default) - Simulate trades without real money
- **Live Trading** - Connect to BitOasis API for real trades
- **Grid/Spread Strategy** - Buy low, sell high with configurable thresholds
- **Risk Management** - Stop loss, position limits, daily trade limits
- **Real-time WebSocket** - Live price updates and trade notifications
- **SQLite Database** - Persistent trade history and configuration

### Safety Features

⚠️ **IMPORTANT**: This bot trades real money when in live mode!

- Paper trading enabled by default
- Only XRP trading pairs are allowed
- Confirmation required to switch to live mode
- Stop loss protection
- Daily trade limits

### Configuration

Edit `apps/trading-bot/.env`:

```env
# Required for live trading
BITOASIS_API_KEY=your_api_key
BITOASIS_API_SECRET=your_api_secret

# Trading mode (true = paper, false = LIVE!)
PAPER_TRADING=true

# Starting capital for simulation
STARTING_CAPITAL_USD=500
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bot/status | Get bot status |
| POST | /api/bot/start | Start the bot |
| POST | /api/bot/stop | Stop the bot |
| GET | /api/stats | Get trading statistics |
| GET | /api/trades | Get trade history |
| GET | /api/config | Get configuration |
| PATCH | /api/config | Update configuration |

## 📊 Dashboard

Real-time web dashboard showing:

- **Portfolio Value** - Current balance in USD and XRP
- **P&L Tracking** - Profit/loss metrics
- **Live Price Chart** - Real-time XRP price
- **Trade History** - All executed trades
- **Bot Controls** - Start/stop, configure settings
- **Configuration Panel** - Adjust strategy parameters

## 📦 Shared Packages

### @openclaw/types

Shared TypeScript type definitions for:
- Trade types and statuses
- Bot configuration
- API responses
- WebSocket events

### @openclaw/utils

Common utilities (coming soon):
- Price calculations
- Risk management helpers
- Validation functions

### @openclaw/config

Shared configuration (coming soon):
- Default values
- Validation schemas

## 🛠️ Commands

```bash
# Build all packages
npm run build

# Lint all packages
npm run lint

# Type check all packages
npm run typecheck

# Format code
npm run format
```

## ⚠️ Disclaimer

This software is for educational purposes. Trading cryptocurrencies involves significant risk. Never trade with money you cannot afford to lose. The authors are not responsible for any financial losses.

## 📄 License

MIT
