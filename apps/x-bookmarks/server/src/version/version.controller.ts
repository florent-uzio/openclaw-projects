import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('version')
export class VersionController {
  private version: string;
  private buildTime: string;

  constructor() {
    // Read version from package.json
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      this.version = packageJson.version || '0.0.0';
    } catch {
      this.version = process.env.APP_VERSION || '0.0.0';
    }
    this.buildTime = process.env.BUILD_TIME || new Date().toISOString();
  }

  @Public()
  @Get()
  getVersion() {
    return {
      version: this.version,
      buildTime: this.buildTime,
      nodeEnv: process.env.NODE_ENV || 'development',
    };
  }
}
