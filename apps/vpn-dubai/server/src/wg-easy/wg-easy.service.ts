import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class WgEasyService {
  private readonly logger = new Logger(WgEasyService.name);
  private client: AxiosInstance;

  constructor(private configService: ConfigService) {
    const baseURL = this.configService.get('WG_EASY_URL') || 'http://localhost:51821';
    const username = this.configService.get('WG_EASY_USERNAME') || 'admin';
    const password = this.configService.get('WG_EASY_PASSWORD') || '';

    this.client = axios.create({
      baseURL,
      auth: { username, password },
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async createClient(name: string, expiresAt?: Date): Promise<{ clientId: string }> {
    try {
      const response = await this.client.post('/api/client', {
        name,
        expiresAt: expiresAt?.toISOString(),
      });
      this.logger.log(`✅ WG client created: ${name} (${response.data.clientId})`);
      return response.data;
    } catch (error) {
      this.logger.error('❌ Failed to create WG client:', error);
      throw error;
    }
  }

  async enableClient(clientId: string): Promise<void> {
    try {
      await this.client.post(`/api/client/${clientId}/enable`);
      this.logger.log(`✅ WG client enabled: ${clientId}`);
    } catch (error) {
      this.logger.error('❌ Failed to enable WG client:', error);
      throw error;
    }
  }

  async disableClient(clientId: string): Promise<void> {
    try {
      await this.client.post(`/api/client/${clientId}/disable`);
      this.logger.log(`✅ WG client disabled: ${clientId}`);
    } catch (error) {
      this.logger.error('❌ Failed to disable WG client:', error);
      throw error;
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    try {
      await this.client.delete(`/api/client/${clientId}`);
      this.logger.log(`✅ WG client deleted: ${clientId}`);
    } catch (error) {
      this.logger.error('❌ Failed to delete WG client:', error);
      throw error;
    }
  }

  async getClientConfig(clientId: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/client/${clientId}/configuration`);
      return response.data;
    } catch (error) {
      this.logger.error('❌ Failed to get WG client config:', error);
      throw error;
    }
  }

  async getClientQRCode(clientId: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/client/${clientId}/qrcode.svg`, {
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      this.logger.error('❌ Failed to get WG client QR code:', error);
      throw error;
    }
  }
}
