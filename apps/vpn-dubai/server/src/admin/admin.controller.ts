import { Controller, Get, Post, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('subscriptions')
  getSubscriptions() {
    return this.adminService.getAllSubscriptions();
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/daily')
  getDailyStats(@Query('days') days?: string) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.adminService.getDailyStats(numDays);
  }

  @Post('subscriptions/:subscriptionId/enable')
  async enableClient(@Param('subscriptionId') subscriptionId: string) {
    try {
      await this.adminService.enableClient(subscriptionId);
      return { success: true, message: 'VPN client enabled' };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to enable client',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('subscriptions/:subscriptionId/disable')
  async disableClient(@Param('subscriptionId') subscriptionId: string) {
    try {
      await this.adminService.disableClient(subscriptionId);
      return { success: true, message: 'VPN client disabled' };
    } catch (error) {
      throw new HttpException(
        error instanceof Error ? error.message : 'Failed to disable client',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
