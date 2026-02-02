import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FoldersService {
  constructor(private db: DatabaseService) {}

  getAll() {
    return this.db.getAllFolders();
  }

  getOne(id: string) {
    const folder = this.db.getFolder(id);
    if (!folder) throw new NotFoundException('Folder not found');
    return folder;
  }

  create(data: { name: string; color?: string; parentId?: string }) {
    const id = uuid();
    this.db.createFolder({ id, ...data });
    return this.db.getFolder(id);
  }

  update(id: string, data: { name?: string; color?: string; parentId?: string | null }) {
    const folder = this.db.getFolder(id);
    if (!folder) throw new NotFoundException('Folder not found');
    this.db.updateFolder(id, data);
    return this.db.getFolder(id);
  }

  delete(id: string) {
    const folder = this.db.getFolder(id);
    if (!folder) throw new NotFoundException('Folder not found');
    this.db.deleteFolder(id);
    return { success: true };
  }
}
