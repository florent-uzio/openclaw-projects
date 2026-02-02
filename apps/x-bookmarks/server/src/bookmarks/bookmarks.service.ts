import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BookmarksService {
  constructor(private db: DatabaseService) {}

  getAll(folderId?: string) {
    if (folderId === 'null' || folderId === 'unsorted') {
      return this.db.getBookmarksByFolder(null);
    }
    if (folderId) {
      return this.db.getBookmarksByFolder(folderId);
    }
    return this.db.getAllBookmarks();
  }

  getOne(id: string) {
    const bookmark = this.db.getBookmark(id);
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    return bookmark;
  }

  create(data: { url: string; folderId?: string; note?: string }) {
    // Extract tweet ID from URL
    const tweetId = this.extractTweetId(data.url);
    if (!tweetId) {
      throw new ConflictException('Invalid X/Twitter URL');
    }

    // Check if already bookmarked
    const existing = this.db.getBookmarkByTweetId(tweetId);
    if (existing) {
      throw new ConflictException('This post is already bookmarked');
    }

    const id = uuid();
    const tweetUrl = `https://x.com/i/status/${tweetId}`;
    
    this.db.createBookmark({
      id,
      tweetId,
      tweetUrl,
      folderId: data.folderId,
      note: data.note,
    });

    return this.db.getBookmark(id);
  }

  update(id: string, data: { folderId?: string | null; note?: string | null }) {
    const bookmark = this.db.getBookmark(id);
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    this.db.updateBookmark(id, data);
    return this.db.getBookmark(id);
  }

  move(id: string, folderId: string | null) {
    const bookmark = this.db.getBookmark(id);
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    this.db.updateBookmark(id, { folderId });
    return this.db.getBookmark(id);
  }

  delete(id: string) {
    const bookmark = this.db.getBookmark(id);
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    this.db.deleteBookmark(id);
    return { success: true };
  }

  getStats() {
    return this.db.getStats();
  }

  private extractTweetId(url: string): string | null {
    // Match various X/Twitter URL formats
    const patterns = [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /(?:twitter\.com|x\.com)\/i\/status\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // If just a number, assume it's a tweet ID
    if (/^\d+$/.test(url.trim())) {
      return url.trim();
    }

    return null;
  }
}
