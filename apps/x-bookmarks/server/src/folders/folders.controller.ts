import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { FoldersService } from './folders.service';

@Controller('folders')
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Get()
  getAll() {
    return this.foldersService.getAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.foldersService.getOne(id);
  }

  @Post()
  create(@Body() body: { name: string; color?: string; parentId?: string }) {
    return this.foldersService.create(body);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string; parentId?: string | null },
  ) {
    return this.foldersService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.foldersService.delete(id);
  }
}
