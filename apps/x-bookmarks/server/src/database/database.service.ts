import { Injectable, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface Folder {
  id: string;
  name: string;
  color: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  tweet_id: string;
  tweet_url: string;
  folder_id: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database.Database;

  onModuleInit() {
    // Use project root data directory
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'bookmarks.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        tweet_id TEXT NOT NULL UNIQUE,
        tweet_url TEXT NOT NULL,
        folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder_id);
      CREATE INDEX IF NOT EXISTS idx_bookmarks_tweet ON bookmarks(tweet_id);
      CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
    `);
    console.log('✅ Database initialized');
  }

  // Folders
  getAllFolders(): Folder[] {
    return this.db.prepare('SELECT * FROM folders ORDER BY name').all() as Folder[];
  }

  getFolder(id: string): Folder | undefined {
    return this.db.prepare('SELECT * FROM folders WHERE id = ?').get(id) as Folder | undefined;
  }

  createFolder(data: { id: string; name: string; color?: string; parentId?: string }) {
    const stmt = this.db.prepare(`
      INSERT INTO folders (id, name, color, parent_id)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(data.id, data.name, data.color || '#3b82f6', data.parentId || null);
  }

  updateFolder(id: string, data: { name?: string; color?: string; parentId?: string | null }) {
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.color !== undefined) {
      fields.push('color = ?');
      values.push(data.color);
    }
    if (data.parentId !== undefined) {
      fields.push('parent_id = ?');
      values.push(data.parentId);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE folders SET ${fields.join(', ')} WHERE id = ?
    `);
    return stmt.run(...values);
  }

  deleteFolder(id: string) {
    return this.db.prepare('DELETE FROM folders WHERE id = ?').run(id);
  }

  // Bookmarks
  getAllBookmarks(): Bookmark[] {
    return this.db.prepare('SELECT * FROM bookmarks ORDER BY created_at DESC').all() as Bookmark[];
  }

  getBookmarksByFolder(folderId: string | null): Bookmark[] {
    if (folderId === null) {
      return this.db.prepare('SELECT * FROM bookmarks WHERE folder_id IS NULL ORDER BY created_at DESC').all() as Bookmark[];
    }
    return this.db.prepare('SELECT * FROM bookmarks WHERE folder_id = ? ORDER BY created_at DESC').all(folderId) as Bookmark[];
  }

  getBookmark(id: string): Bookmark | undefined {
    return this.db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id) as Bookmark | undefined;
  }

  getBookmarkByTweetId(tweetId: string): Bookmark | undefined {
    return this.db.prepare('SELECT * FROM bookmarks WHERE tweet_id = ?').get(tweetId) as Bookmark | undefined;
  }

  createBookmark(data: { id: string; tweetId: string; tweetUrl: string; folderId?: string; note?: string }) {
    const stmt = this.db.prepare(`
      INSERT INTO bookmarks (id, tweet_id, tweet_url, folder_id, note)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(data.id, data.tweetId, data.tweetUrl, data.folderId || null, data.note || null);
  }

  updateBookmark(id: string, data: { folderId?: string | null; note?: string | null }) {
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (data.folderId !== undefined) {
      fields.push('folder_id = ?');
      values.push(data.folderId);
    }
    if (data.note !== undefined) {
      fields.push('note = ?');
      values.push(data.note);
    }

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE bookmarks SET ${fields.join(', ')} WHERE id = ?
    `);
    return stmt.run(...values);
  }

  deleteBookmark(id: string) {
    return this.db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id);
  }

  getStats() {
    const totalBookmarks = (this.db.prepare('SELECT COUNT(*) as count FROM bookmarks').get() as any).count;
    const totalFolders = (this.db.prepare('SELECT COUNT(*) as count FROM folders').get() as any).count;
    const unorganized = (this.db.prepare('SELECT COUNT(*) as count FROM bookmarks WHERE folder_id IS NULL').get() as any).count;
    return { totalBookmarks, totalFolders, unorganized };
  }
}
