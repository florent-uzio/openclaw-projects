import axios, { AxiosInstance } from 'axios';

const WG_EASY_URL = process.env.WG_EASY_URL || 'http://localhost:51821';
const WG_EASY_USERNAME = process.env.WG_EASY_USERNAME || 'admin';
const WG_EASY_PASSWORD = process.env.WG_EASY_PASSWORD || '';

class WgEasyClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: WG_EASY_URL,
      auth: {
        username: WG_EASY_USERNAME,
        password: WG_EASY_PASSWORD,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async createClient(name: string, expiresAt?: Date): Promise<{ clientId: string }> {
    try {
      const response = await this.client.post('/api/client', {
        name,
        expiresAt: expiresAt?.toISOString(),
      });
      console.log(`✅ WG client created: ${name} (${response.data.clientId})`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to create WG client:', error);
      throw error;
    }
  }

  async enableClient(clientId: string): Promise<void> {
    try {
      await this.client.post(`/api/client/${clientId}/enable`);
      console.log(`✅ WG client enabled: ${clientId}`);
    } catch (error) {
      console.error('❌ Failed to enable WG client:', error);
      throw error;
    }
  }

  async disableClient(clientId: string): Promise<void> {
    try {
      await this.client.post(`/api/client/${clientId}/disable`);
      console.log(`✅ WG client disabled: ${clientId}`);
    } catch (error) {
      console.error('❌ Failed to disable WG client:', error);
      throw error;
    }
  }

  async deleteClient(clientId: string): Promise<void> {
    try {
      await this.client.delete(`/api/client/${clientId}`);
      console.log(`✅ WG client deleted: ${clientId}`);
    } catch (error) {
      console.error('❌ Failed to delete WG client:', error);
      throw error;
    }
  }

  async getClientConfig(clientId: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/client/${clientId}/configuration`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to get WG client config:', error);
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
      console.error('❌ Failed to get WG client QR code:', error);
      throw error;
    }
  }

  getQRCodeUrl(clientId: string): string {
    // Return the direct URL to the QR code SVG
    const auth = Buffer.from(`${WG_EASY_USERNAME}:${WG_EASY_PASSWORD}`).toString('base64');
    return `${WG_EASY_URL}/api/client/${clientId}/qrcode.svg`;
  }
}

export const wgEasy = new WgEasyClient();
