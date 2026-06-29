import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  data: any;
  expires: number;
}

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com';
const TWEET_ID = /^[0-9]+$/;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Fetches tweets from the Twitter syndication API server-side.
 *
 * Doing this on the backend (instead of letting react-tweet hit its public
 * demo API at react-tweet.vercel.app) avoids the rate-limiting/404s that come
 * from sharing that endpoint, and sidesteps browser CORS restrictions.
 *
 * The fetch logic mirrors react-tweet's own `fetchTweet`. We re-implement it
 * here rather than importing `react-tweet/api` because that package is ESM-only
 * and the NestJS server is compiled to CommonJS.
 */
@Injectable()
export class TweetsService {
  private readonly logger = new Logger(TweetsService.name);
  private readonly cache = new Map<string, CacheEntry>();

  async getTweet(id: string): Promise<any | null> {
    if (!TWEET_ID.test(id) || id.length > 40) {
      return null;
    }

    const cached = this.cache.get(id);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    const data = await this.fetchFromSyndication(id);
    this.cache.set(id, { data, expires: Date.now() + CACHE_TTL_MS });
    return data;
  }

  // Replicates the token derivation used by the Twitter syndication API.
  private getToken(id: string): string {
    return ((Number(id) / 1e15) * Math.PI)
      .toString(6 ** 2)
      .replace(/(0+|\.)/g, '');
  }

  private async fetchFromSyndication(id: string): Promise<any | null> {
    const url = new URL(`${SYNDICATION_URL}/tweet-result`);
    url.searchParams.set('id', id);
    url.searchParams.set('lang', 'en');
    url.searchParams.set(
      'features',
      [
        'tfw_timeline_list:',
        'tfw_follower_count_sunset:true',
        'tfw_tweet_edit_backend:on',
        'tfw_refsrc_session:on',
        'tfw_fosnr_soft_interventions_enabled:on',
        'tfw_show_birdwatch_pivots_enabled:on',
        'tfw_show_business_verified_badge:on',
        'tfw_duplicate_scribes_to_settings:on',
        'tfw_use_profile_image_shape_enabled:on',
        'tfw_show_blue_verified_badge:on',
        'tfw_legacy_timeline_sunset:true',
        'tfw_show_gov_verified_badge:on',
        'tfw_show_business_affiliate_badge:on',
        'tfw_tweet_edit_frontend:on',
      ].join(';'),
    );
    url.searchParams.set('token', this.getToken(id));

    try {
      const res = await fetch(url.toString());
      const isJson = res.headers
        .get('content-type')
        ?.includes('application/json');
      const data: any = isJson ? await res.json() : undefined;

      if (res.ok) {
        // Tombstoned (made private) or empty payload => treat as not found.
        if (data?.__typename === 'TweetTombstone') return null;
        if (data && Object.keys(data).length === 0) return null;
        return data ?? null;
      }

      if (res.status !== 404) {
        this.logger.warn(`Failed to fetch tweet ${id}: HTTP ${res.status}`);
      }
      return null;
    } catch (err) {
      this.logger.warn(`Error fetching tweet ${id}: ${err}`);
      return null;
    }
  }
}
