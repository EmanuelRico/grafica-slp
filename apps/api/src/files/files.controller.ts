import { Controller, Post, Get, Body, Param, Header, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesService } from './files.service';
import { IsString } from 'class-validator';

class UploadUrlDto {
  @IsString() filename: string;
  @IsString() mimeType: string;
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) { }

  @Post('upload-url')
  async getUploadUrl(@Body() dto: UploadUrlDto) {
    return this.filesService.getUploadUrl(dto.filename, dto.mimeType);
  }

  @Get('download/:key(*)')
  @UseGuards(AuthGuard('jwt'))
  @Header('Content-Disposition', 'attachment')
  async download(@Param('key') key: string) {
    const { stream, contentType } = await this.filesService.getFileStream(key);
    return new StreamableFile(stream, { type: contentType });
  }
}
