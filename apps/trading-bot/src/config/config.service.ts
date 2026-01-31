import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { BotConfig, ConfigUpdate } from '@openclaw/types';

@Injectable()
export class BotConfigService {
  private readonly logger = new Logger(BotConfigService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  getConfig(): BotConfig {
    return this.db.getConfig();
  }

  updateConfig(updates: ConfigUpdate): BotConfig {
    this.logger.log('Updating config:', updates);
    
    if (updates.minProfitPercent !== undefined) {
      const config = this.db.getConfig();
      const minRequired = (config.takerFee * 100 * 2) + 0.1;
      if (updates.minProfitPercent < minRequired) {
        throw new Error(`Minimum profit must be at least ${minRequired.toFixed(2)}% to cover fees`);
      }
    }

    const newConfig = this.db.updateConfig(updates);
    this.wsGateway.broadcastConfigChanged(newConfig);
    return newConfig;
  }

  resetBalance(): { balance: ReturnType<DatabaseService['getBalance']> } {
    const config = this.db.getConfig();
    const balance = this.db.resetBalance(config.startingCapitalUsd);
    this.logger.log(`Balance reset to $${config.startingCapitalUsd}`);
    return { balance };
  }
}
