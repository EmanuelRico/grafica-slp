import { Controller, Post, Body } from '@nestjs/common';
import { FilesService } from './files.service';
import { IsString } from 'class-validator';

class UploadUrlDto {
  @IsString() filename: string;
  @IsString() mimeType: string;
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  async getUploadUrl(@Body() dto: UploadUrlDto) {
    return this.filesService.getUploadUrl(dto.filename, dto.mimeType);
  }
}
