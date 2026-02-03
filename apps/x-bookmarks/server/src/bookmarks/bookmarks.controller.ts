import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
export class BookmarksController {
  constructor(private bookmarksService: BookmarksService) {}

  @Get()
  getAll(@Query('folderId') folderId?: string) {
    return this.bookmarksService.getAll(folderId);
  }

  @Get('stats')
  getStats() {
    return this.bookmarksService.getStats();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.bookmarksService.getOne(id);
  }

  @Post()
  create(@Body() body: { url: string; folderId?: string; note?: string }) {
    return this.bookmarksService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { folderId?: string | null; note?: string | null },
  ) {
    return this.bookmarksService.update(id, body);
  }

  @Put(':id/move')
  move(@Param('id') id: string, @Body() body: { folderId: string | null }) {
    return this.bookmarksService.move(id, body.folderId);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.bookmarksService.delete(id);
  }
}
