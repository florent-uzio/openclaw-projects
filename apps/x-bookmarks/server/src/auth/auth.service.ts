import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly password: string;
  private readonly secret: string;
  private readonly tokenExpiry = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(private configService: ConfigService) {
    this.password = this.configService.get('AUTH_PASSWORD') || 'changeme';
    this.secret = this.configService.get('AUTH_SECRET') || crypto.randomBytes(32).toString('hex');
    
    if (this.password === 'changeme') {
      console.warn('⚠️  WARNING: Using default password. Set AUTH_PASSWORD environment variable!');
    }
  }

  validatePassword(password: string): boolean {
    return password === this.password;
  }

  generateToken(): string {
    const expiry = Date.now() + this.tokenExpiry;
    const data = `${expiry}`;
    const hmac = crypto.createHmac('sha256', this.secret).update(data).digest('hex');
    return Buffer.from(JSON.stringify({ expiry, hmac })).toString('base64');
  }

  validateToken(token: string): boolean {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { expiry, hmac } = decoded;

      // Check expiry
      if (Date.now() > expiry) {
        return false;
      }

      // Verify HMAC
      const expectedHmac = crypto.createHmac('sha256', this.secret).update(`${expiry}`).digest('hex');
      return hmac === expectedHmac;
    } catch {
      return false;
    }
  }
}
