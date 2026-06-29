import { Controller, Get, Param } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { TweetsService } from './tweets.service';

@Controller('tweet')
export class TweetsController {
  constructor(private readonly tweetsService: TweetsService) {}

  // Public so react-tweet's client fetcher can load embeds without a token.
  // Returns { data } to match the shape react-tweet's SWR fetcher expects;
  // `data: null` makes it render its "Tweet not found" fallback gracefully.
  @Public()
  @Get(':id')
  async getTweet(@Param('id') id: string) {
    const data = await this.tweetsService.getTweet(id);
    return { data };
  }
}
